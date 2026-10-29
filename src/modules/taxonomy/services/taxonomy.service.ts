import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Actor, staffHas, StaffActor } from '../../../common/context/actor';
import { FieldErrors, ForbiddenError, NotFoundError, ValidationFailedError } from '../../../common/errors';
import { Locale, LocalizedText, pickText } from '../../../common/i18n/locale';
import { PrismaService, TransactionRunner, Tx } from '../../../platform/database';
import { AuditLogger, auditActorOf } from '../../audit';
import {
  FIXED_LISTS,
  FixedKind,
  isFixedKind,
  isTaxonomyKind,
  TableKind,
  TAXONOMY_ENTITY_IDS,
  TaxonomyKind,
  slugify,
  uniqueSlug,
} from '../domain/kinds';

// Keys from the staff permission catalog (modules/access); plain strings keep taxonomy at layer L0.
const VIEW = 'settings.view';
const MANAGE = 'settings.manage';

/** contracts/admin `TaxonomyItem`. For fixed kinds the id is the code. */
export interface TaxonomyItemView {
  id: string;
  name: LocalizedText;
  active: boolean;
  order: number;
}

/** One entry of the app's picker lists, in the request language. */
export interface PublicTaxonomyItem {
  id: string;
  name: string;
}

export interface PublicTaxonomy {
  cities: (PublicTaxonomyItem & { region: PublicTaxonomyItem | null })[];
  crafts: PublicTaxonomyItem[];
  industries: PublicTaxonomyItem[];
  company_types: PublicTaxonomyItem[];
  opportunity_types: PublicTaxonomyItem[];
  news_topics: PublicTaxonomyItem[];
}

const name = z.string().trim().min(1, 'is required').max(120);
const itemsSchema = z
  .array(
    z
      .object({
        id: z.string().min(1).max(64).optional(),
        name: z.object({ en: name, ar: name }).strict(),
        active: z.boolean().optional(),
        order: z.number().int().min(0).max(100_000).optional(),
      })
      .strict(),
  )
  .max(1000);
type ItemInput = z.infer<typeof itemsSchema>[number];

interface TableRow {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  sortOrder: number;
  isActive: boolean;
}

const rowView = (r: TableRow): TaxonomyItemView => ({
  id: r.id,
  name: { en: r.nameEn, ar: r.nameAr },
  active: r.isActive,
  order: r.sortOrder,
});

function fail(errors: FieldErrors): never {
  throw new ValidationFailedError(errors);
}

/**
 * Taxonomy (contracts/admin GET/PUT /taxonomy/{kind}, contracts/app GET /meta/taxonomy).
 * PUT replaces a list: table kinds update the items sent, create those without an id
 * and deactivate those left out (never delete); fixed kinds accept new labels and
 * order for exactly their codes. Changes are audited as `taxonomy.update`.
 */
@Injectable()
export class TaxonomyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
  ) {}

  async list(actor: Actor | undefined, kind: string): Promise<TaxonomyItemView[]> {
    if (!staffHas(actor, VIEW)) throw new ForbiddenError();
    return this.read(this.prisma, this.requireKind(kind));
  }

  async replace(actor: Actor | undefined, kind: string, input: unknown): Promise<TaxonomyItemView[]> {
    if (!staffHas(actor, MANAGE)) throw new ForbiddenError();
    const taxonomyKind = this.requireKind(kind);
    const parsed = itemsSchema.safeParse(input);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) (errors[issue.path.join('.') || '(body)'] ??= []).push(issue.message);
      fail(errors);
    }
    const items = parsed.data;
    const ids = items.map((i) => i.id).filter((id): id is string => Boolean(id));
    const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
    if (duplicate) fail({ id: [`${duplicate} appears twice`] });

    return this.transactions.run(async (tx) => {
      const before = await this.read(tx, taxonomyKind);
      if (isFixedKind(taxonomyKind)) {
        await this.replaceFixed(tx, taxonomyKind, items);
      } else {
        await this.replaceTable(tx, taxonomyKind, items);
      }
      const after = await this.read(tx, taxonomyKind);
      await this.audit.record({
        actor: auditActorOf(actor as StaffActor),
        action: 'taxonomy.update',
        entityType: `taxonomy.${taxonomyKind}`,
        entityId: TAXONOMY_ENTITY_IDS[taxonomyKind],
        changes: { before, after },
      });
      return after;
    });
  }

  /** Active items for the app's pickers, in one language (`GET /api/app/v1/meta/taxonomy`). */
  async publicCatalog(locale: Locale): Promise<PublicTaxonomy> {
    const item = (v: TaxonomyItemView): PublicTaxonomyItem => ({ id: v.id, name: pickText(v.name, locale) });
    const active = async (kind: TaxonomyKind) => (await this.read(this.prisma, kind)).filter((v) => v.active).map(item);

    const cities = await this.prisma.location.findMany({
      where: { type: 'CITY', isActive: true },
      include: { parent: true },
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    });
    return {
      cities: cities.map((c) => ({
        id: c.id,
        name: pickText({ en: c.nameEn, ar: c.nameAr }, locale),
        region: c.parent
          ? { id: c.parent.id, name: pickText({ en: c.parent.nameEn, ar: c.parent.nameAr }, locale) }
          : null,
      })),
      crafts: await active('crafts'),
      industries: await active('industries'),
      company_types: await active('company_types'),
      opportunity_types: await active('opportunity_types'),
      news_topics: await active('news_topics'),
    };
  }

  private requireKind(kind: string): TaxonomyKind {
    if (!isTaxonomyKind(kind)) throw new NotFoundError(`Unknown taxonomy kind "${kind}"`);
    return kind;
  }

  private async read(db: Tx | PrismaService, kind: TaxonomyKind): Promise<TaxonomyItemView[]> {
    if (isFixedKind(kind)) {
      const overrides = new Map(
        (await db.taxonomyLabel.findMany({ where: { kind } })).map((l) => [l.code, l] as const),
      );
      return FIXED_LISTS[kind]
        .map((item, index) => {
          const o = overrides.get(item.code);
          return {
            id: item.code,
            name: o ? { en: o.nameEn, ar: o.nameAr } : item.name,
            active: true,
            order: o ? o.sortOrder : index,
          };
        })
        .sort((a, b) => a.order - b.order);
    }
    const orderBy = [{ sortOrder: 'asc' as const }, { nameEn: 'asc' as const }];
    switch (kind) {
      case 'cities':
        return (await db.location.findMany({ where: { type: 'CITY' }, orderBy })).map(rowView);
      case 'crafts':
        return (await db.skill.findMany({ orderBy })).map(rowView);
      case 'industries':
        return (await db.industry.findMany({ orderBy })).map(rowView);
    }
  }

  private async replaceFixed(tx: Tx, kind: FixedKind, items: ItemInput[]): Promise<void> {
    const codes = FIXED_LISTS[kind].map((i) => i.code);
    const sent = items.map((i) => i.id ?? '');
    const missing = codes.filter((c) => !sent.includes(c));
    const unknown = sent.filter((c) => !codes.includes(c));
    const errors: FieldErrors = {};
    if (missing.length) errors.id = [`every code must be sent; missing: ${missing.join(', ')}`];
    if (unknown.length)
      (errors.id ??= []).push(`codes cannot be added: ${unknown.map((c) => c || '(no id)').join(', ')}`);
    if (items.some((i) => i.active === false))
      errors.active = [`${kind} cannot be deactivated; only renamed and reordered`];
    if (Object.keys(errors).length) fail(errors);

    for (const [index, item] of items.entries()) {
      const data = { nameEn: item.name.en, nameAr: item.name.ar, sortOrder: item.order ?? index };
      await tx.taxonomyLabel.upsert({
        where: { kind_code: { kind, code: item.id! } },
        create: { kind, code: item.id!, ...data },
        update: data,
      });
    }
  }

  private async replaceTable(tx: Tx, kind: TableKind, items: ItemInput[]): Promise<void> {
    const delegate = this.delegate(tx, kind);
    const existing = await delegate.findMany({ where: kind === 'cities' ? { type: 'CITY' } : {} });
    const byId = new Map(existing.map((r) => [r.id, r] as const));
    const unknown = items.filter((i) => i.id && !byId.has(i.id)).map((i) => i.id!);
    if (unknown.length) fail({ id: [`unknown ${kind} id(s): ${unknown.join(', ')}`] });

    // Slugs are unique across the whole table (regions included for locations).
    const taken = new Set((await delegate.findMany({ select: { slug: true } })).map((r) => r.slug));
    const kept = new Set<string>();
    for (const [index, item] of items.entries()) {
      const data = {
        nameEn: item.name.en,
        nameAr: item.name.ar,
        sortOrder: item.order ?? index,
        isActive: item.active ?? true,
      };
      if (item.id) {
        kept.add(item.id);
        await delegate.update({ where: { id: item.id }, data });
      } else {
        const slug = uniqueSlug(slugify(item.name.en), taken);
        taken.add(slug);
        await delegate.create({ data: { ...data, slug, ...(kind === 'cities' ? { type: 'CITY' } : {}) } });
      }
    }
    const leftOut = existing.filter((r) => !kept.has(r.id) && r.isActive).map((r) => r.id);
    if (leftOut.length) {
      await delegate.updateMany({ where: { id: { in: leftOut } }, data: { isActive: false } });
    }
  }

  /** The Prisma delegate for a table kind, narrowed to the calls this service makes. */
  private delegate(tx: Tx, kind: TableKind) {
    type Delegate = {
      findMany(args: { where?: object; select?: { slug: true } }): Promise<TableRow[]>;
      update(args: { where: { id: string }; data: object }): Promise<unknown>;
      create(args: { data: object }): Promise<unknown>;
      updateMany(args: { where: object; data: object }): Promise<unknown>;
    };
    const delegates: Record<TableKind, unknown> = { cities: tx.location, crafts: tx.skill, industries: tx.industry };
    return delegates[kind] as Delegate;
  }
}
