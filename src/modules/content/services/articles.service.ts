import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor, StaffActor, staffHas } from '../../../common/context/actor';
import { DomainError, ErrorCode, ForbiddenError, NotFoundError, ValidationFailedError } from '../../../common/errors';
import { isUuid, uuidv7 } from '../../../common/ids/uuid-v7';
import { parseInput } from '../../../common/validation/parse-input';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner, Tx } from '../../../platform/database';
import { OutboxWriter } from '../../../platform/outbox';
import { AuditLogger, auditActorOf, SYSTEM_ACTOR } from '../../audit';
import { FIXED_LISTS } from '../../taxonomy';
import { articleSlug, translationGaps, TranslationText } from '../domain/article-checks';
import { sanitizeArticleHtml } from '../domain/article-html';
import { ArticleAction, ArticleStatus, mustStayComplete, nextArticleStatus } from '../domain/article-state';

export const NEWS_TOPICS = FIXED_LISTS.news_topics.map((t) => t.code) as [string, ...string[]];
export const ARTICLE_LINK_TYPES = ['OPPORTUNITY', 'EVENT', 'COMPANY'] as const;

/** How far ahead an article may be scheduled, and how late "now" may be. */
const MAX_SCHEDULE_DAYS = 366;
const PAST_TOLERANCE_MS = 5 * 60_000;
const DAY_MS = 86_400_000;

const translationSchema = z
  .object({
    headline: z.string().trim().max(90),
    excerpt: z.string().trim().max(200).nullable().optional(),
    body: z.string().max(100_000),
    cta_label: z.string().trim().max(40).nullable().optional(),
  })
  .strict();

const inputSchema = z
  .object({
    category: z.enum(NEWS_TOPICS).optional(),
    cover_upload_id: z.string().uuid().optional(),
    cover_alt: z
      .object({ en: z.string().trim().max(250).optional(), ar: z.string().trim().max(250).optional() })
      .strict()
      .optional(),
    en: translationSchema.optional(),
    ar: translationSchema.optional(),
    link: z
      .object({ type: z.enum(ARTICLE_LINK_TYPES), id: z.string().uuid() })
      .strict()
      .nullable()
      .optional(),
  })
  .strict();

const audienceSchema = z
  .object({
    match: z.enum(['ALL', 'ANY']).optional(),
    rules: z
      .array(
        z
          .object({
            field: z.enum([
              'CITY',
              'ACCOUNT_TYPE',
              'INTERESTS',
              'IS_STUDENT',
              'VERIFIED',
              'POINTS_GTE',
              'JOINED_AFTER',
              'COMPANY_VERIFIED',
              'FOLLOWS_COMPANY',
            ]),
            op: z.enum(['IS', 'IS_NOT', 'ANY_OF', 'GTE', 'LTE']),
            value: z.union([z.string().max(200), z.number(), z.boolean(), z.array(z.string().max(200)).max(100)]),
          })
          .strict(),
      )
      .max(20),
  })
  .strict();

const scheduleSchema = z
  .object({
    publish_at: z.string().datetime({ offset: true }).nullable().optional(),
    notify_push: z.boolean().optional(),
    push_audience: audienceSchema.nullable().optional(),
    feature_on_home_days: z.number().int().min(0).max(14).nullable().optional(),
    share_to_company_followers: z.boolean().optional(),
  })
  .strict();

const SORTS = ['updated_at', 'created_at', 'published_at', 'scheduled_at'] as const;
const SORT_FIELDS: Record<(typeof SORTS)[number], keyof Prisma.ArticleOrderByWithRelationInput> = {
  updated_at: 'updatedAt',
  created_at: 'createdAt',
  published_at: 'publishedAt',
  scheduled_at: 'scheduledAt',
};

const NULLABLE_SORTS = new Set<string>(['publishedAt', 'scheduledAt']);

const listSchema = z.object({
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(100),
  sort: z
    .string()
    .regex(new RegExp(`^-?(${SORTS.join('|')})$`), `must be one of ${SORTS.join(', ')}, optionally prefixed with -`)
    .optional(),
  status: z.enum(['PUBLISHED', 'SCHEDULED', 'DRAFT']).optional(),
});

export interface ArticleTranslationView {
  headline: string;
  excerpt: string | null;
  body: string;
  ctaLabel: string | null;
}

/** contracts/admin `ArticleAdmin`. */
export interface ArticleAdminView {
  id: string;
  slug: string;
  topic: string | null;
  coverUrl: string | null;
  coverAlt: { en: string; ar: string } | null;
  en: ArticleTranslationView | null;
  ar: ArticleTranslationView | null;
  link: { type: (typeof ARTICLE_LINK_TYPES)[number]; id: string } | null;
  status: ArticleStatus;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  author: { id: string; name: string };
  reads: number;
  updatedAt: Date;
}

/** What the pre-publish checks read (backoffice composes the cross-module ones). */
export interface ArticleForChecks {
  topic: string | null;
  en: TranslationText;
  ar: TranslationText;
  hasCover: boolean;
  coverAlt: { en: string | null; ar: string | null };
  link: { type: (typeof ARTICLE_LINK_TYPES)[number]; id: string } | null;
}

type ArticleRow = Prisma.ArticleGetPayload<{ include: { author: { select: { name: true } } } }>;
type Input = z.infer<typeof inputSchema>;

const withAuthor = { author: { select: { name: true } } } as const;

/**
 * The editorial desk (contracts/admin /articles*, nest-module-map.md §4.10). Staff with
 * `news.manage` write drafts in English and Arabic, then publish now or at a time. Both
 * languages must be complete before an article is scheduled or published, and stay
 * complete while it is scheduled or live (422 `TRANSLATION_MISSING`). Every write is
 * audited; publishing and unpublishing are emitted as events.
 */
@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly outbox: OutboxWriter,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async list(actor: Actor | undefined, input: unknown): Promise<{ items: ArticleAdminView[]; total: number }> {
    this.requireStaff(actor, 'news.view');
    const query = parseInput(listSchema, input);
    // DRAFT lists everything not live and not scheduled, so taken-down articles stay findable.
    const where: Prisma.ArticleWhereInput = !query.status
      ? {}
      : query.status === 'DRAFT'
        ? { status: { in: ['DRAFT', 'UNPUBLISHED'] } }
        : { status: query.status };
    const sort = query.sort ?? '-updated_at';
    const field = SORT_FIELDS[sort.replace(/^-/, '') as (typeof SORTS)[number]];
    const direction = sort.startsWith('-') ? 'desc' : 'asc';
    const [rows, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: withAuthor,
        // Unpublished and unscheduled rows have no time; they come last either way.
        orderBy: [
          { [field]: NULLABLE_SORTS.has(field) ? { sort: direction, nulls: 'last' } : direction },
          { id: 'asc' },
        ],
        skip: (query.page - 1) * query.page_size,
        take: query.page_size,
      }),
      this.prisma.article.count({ where }),
    ]);
    return { items: rows.map(view), total };
  }

  async get(actor: Actor | undefined, articleId: string): Promise<ArticleAdminView> {
    this.requireStaff(actor, 'news.view');
    return view(await this.find(this.prisma, articleId));
  }

  /** For the pre-publish checklist (`news.manage`). */
  async forChecks(actor: Actor | undefined, articleId: string): Promise<ArticleForChecks> {
    this.requireStaff(actor, 'news.manage');
    const row = await this.find(this.prisma, articleId);
    return {
      topic: row.topic,
      en: { headline: row.headlineEn, excerpt: row.excerptEn, body: row.bodyEn },
      ar: { headline: row.headlineAr, excerpt: row.excerptAr, body: row.bodyAr },
      hasCover: false,
      coverAlt: { en: row.coverAltEn, ar: row.coverAltAr },
      link: row.linkType && row.linkId ? { type: row.linkType, id: row.linkId } : null,
    };
  }

  async create(actor: Actor | undefined, input: unknown): Promise<ArticleAdminView> {
    const staff = this.requireStaff(actor, 'news.manage');
    const data = this.parse(input);
    const id = uuidv7(this.clock.now().getTime());
    const fields = columns(data);
    await this.transactions.run(async (tx) => {
      await tx.article.create({
        data: {
          id,
          ...fields,
          slug: articleSlug(fields.headlineEn ?? null, id),
          authorStaffId: staff.staffId,
        },
      });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: 'article.create',
        entityType: 'article',
        entityId: id,
        changes: { after: { fields: Object.keys(data) } },
      });
    });
    return view(await this.find(this.prisma, id));
  }

  /** Autosave. Scheduled and live articles must keep both languages complete. */
  async update(actor: Actor | undefined, articleId: string, input: unknown): Promise<ArticleAdminView> {
    const staff = this.requireStaff(actor, 'news.manage');
    const data = this.parse(input);
    await this.transactions.run(async (tx) => {
      const row = await this.lock(tx, articleId);
      const fields = columns(data);
      const merged = { ...row, ...fields };
      if (mustStayComplete(row.status)) this.requireComplete(merged);
      await tx.article.update({
        where: { id: articleId },
        data: {
          ...fields,
          // The handle follows the English headline until the article first goes live.
          ...(row.publishedAt ? {} : { slug: articleSlug(merged.headlineEn, articleId) }),
        },
      });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: 'article.update',
        entityType: 'article',
        entityId: articleId,
        changes: { after: { fields: Object.keys(data) } },
      });
    });
    return view(await this.find(this.prisma, articleId));
  }

  /** Publish now (`publish_at` null, or now) or at a later time. */
  async schedule(actor: Actor | undefined, articleId: string, input: unknown): Promise<ArticleAdminView> {
    const staff = this.requireStaff(actor, 'news.manage');
    const data = parseInput(scheduleSchema, input);
    const now = this.clock.now();
    const at = data.publish_at ? new Date(data.publish_at) : null;
    if (at && at.getTime() < now.getTime() - PAST_TOLERANCE_MS) {
      throw new ValidationFailedError({ publish_at: ['must not be in the past; leave it empty to publish now'] });
    }
    if (at && at.getTime() > now.getTime() + MAX_SCHEDULE_DAYS * DAY_MS) {
      throw new ValidationFailedError({ publish_at: [`must be within ${MAX_SCHEDULE_DAYS} days`] });
    }
    const later = at !== null && at.getTime() > now.getTime();
    await this.transactions.run(async (tx) => {
      const row = await this.lock(tx, articleId);
      const action: ArticleAction = later ? 'SCHEDULE' : 'PUBLISH';
      const status = this.transition(row.status, action);
      this.requireComplete(row);
      const options = {
        notifyPush: data.notify_push ?? false,
        pushAudience: data.push_audience ?? Prisma.DbNull,
        featureOnHomeDays: data.feature_on_home_days ?? null,
        shareToCompanyFollowers: data.share_to_company_followers ?? false,
      };
      await tx.article.update({
        where: { id: articleId },
        data: later
          ? { ...options, status, scheduledAt: at, featuredUntil: null }
          : { ...options, ...this.going(now, options.featureOnHomeDays), status, scheduledAt: null },
      });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: later ? 'article.schedule' : 'article.publish',
        entityType: 'article',
        entityId: articleId,
        changes: {
          before: { status: row.status },
          after: { status, ...(later ? { scheduled_at: at!.toISOString() } : {}) },
        },
      });
      if (!later) await this.emitPublished(tx, articleId, { type: 'STAFF', user_id: staff.staffId });
    });
    return view(await this.find(this.prisma, articleId));
  }

  /** A scheduled article goes back to draft. */
  async unschedule(actor: Actor | undefined, articleId: string): Promise<ArticleAdminView> {
    const staff = this.requireStaff(actor, 'news.manage');
    await this.transactions.run(async (tx) => {
      const row = await this.lock(tx, articleId);
      const status = this.transition(row.status, 'UNSCHEDULE');
      await tx.article.update({ where: { id: articleId }, data: { status, scheduledAt: null } });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: 'article.unschedule',
        entityType: 'article',
        entityId: articleId,
        changes: { before: { status: row.status }, after: { status } },
      });
    });
    return view(await this.find(this.prisma, articleId));
  }

  /** A live article is taken down; members can no longer open, like or comment on it. */
  async unpublish(actor: Actor | undefined, articleId: string): Promise<ArticleAdminView> {
    const staff = this.requireStaff(actor, 'news.manage');
    await this.transactions.run(async (tx) => {
      const row = await this.lock(tx, articleId);
      const status = this.transition(row.status, 'UNPUBLISH');
      await tx.article.update({ where: { id: articleId }, data: { status, featuredUntil: null } });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: 'article.unpublish',
        entityType: 'article',
        entityId: articleId,
        changes: { before: { status: row.status }, after: { status } },
      });
      await this.outbox.emit({
        name: 'article.unpublished',
        aggregateType: 'article',
        aggregateId: articleId,
        actor: { type: 'STAFF', user_id: staff.staffId },
        data: { article_id: articleId },
      });
    });
    return view(await this.find(this.prisma, articleId));
  }

  /**
   * The `article.publish` job: scheduled articles whose time has come go live, each in its
   * own transaction. `published_at` is the scheduled time, so a late run keeps the order.
   */
  async releaseDue(limit = 50): Promise<number> {
    const now = this.clock.now();
    const due = await this.prisma.article.findMany({
      where: { status: 'SCHEDULED', scheduledAt: { lte: now } },
      select: { id: true },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
    });
    let released = 0;
    for (const { id } of due) {
      released += await this.transactions.run(async (tx) => {
        const [row] = await tx.$queryRaw<{ status: string; scheduled_at: Date | null }[]>`
          SELECT status::text AS status, scheduled_at FROM app.articles WHERE id = ${id}::uuid FOR UPDATE SKIP LOCKED
        `;
        if (row?.status !== 'SCHEDULED' || !row.scheduled_at || row.scheduled_at > now) return 0;
        const article = await this.find(tx, id);
        const status = this.transition(article.status, 'RELEASE');
        await tx.article.update({
          where: { id },
          data: { status, scheduledAt: null, ...this.going(row.scheduled_at, article.featureOnHomeDays) },
        });
        await this.audit.record({
          actor: SYSTEM_ACTOR,
          action: 'article.publish',
          entityType: 'article',
          entityId: id,
          changes: { before: { status: 'SCHEDULED' }, after: { status } },
        });
        await this.emitPublished(tx, id, { type: 'SYSTEM', user_id: null });
        return 1;
      });
    }
    return released;
  }

  /** Columns set when an article goes live at `at`. */
  private going(at: Date, featureDays: number | null) {
    return {
      publishedAt: at,
      featuredUntil: featureDays ? new Date(at.getTime() + featureDays * DAY_MS) : null,
    };
  }

  private async emitPublished(tx: Tx, articleId: string, actor: { type: 'STAFF' | 'SYSTEM'; user_id: string | null }) {
    const row = await this.find(tx, articleId);
    await this.outbox.emit({
      name: 'article.published',
      aggregateType: 'article',
      aggregateId: articleId,
      actor,
      data: {
        article_id: articleId,
        slug: row.slug,
        topic: row.topic,
        notify_push: row.notifyPush,
        push_audience: row.pushAudience,
        share_to_company_followers: row.shareToCompanyFollowers,
        link_type: row.linkType,
        link_id: row.linkId,
      },
    });
  }

  private parse(input: unknown): Input {
    const data = parseInput(inputSchema, input);
    if (data.cover_upload_id) {
      // There is no upload pipeline yet (Phase 1B, TQ-10); refuse rather than drop the image.
      throw new ValidationFailedError({ cover_upload_id: ['cover images arrive with uploads (POST /uploads)'] });
    }
    return data;
  }

  private requireComplete(row: {
    topic: string | null;
    headlineEn: string | null;
    excerptEn: string | null;
    bodyEn: string | null;
    headlineAr: string | null;
    excerptAr: string | null;
    bodyAr: string | null;
  }): void {
    const gaps = translationGaps({
      topic: row.topic,
      en: { headline: row.headlineEn, excerpt: row.excerptEn, body: row.bodyEn },
      ar: { headline: row.headlineAr, excerpt: row.excerptAr, body: row.bodyAr },
    });
    if (Object.keys(gaps).length > 0) {
      throw new DomainError(
        ErrorCode.TRANSLATION_MISSING,
        'English and Arabic must both be complete',
        HttpStatus.UNPROCESSABLE_ENTITY,
        gaps,
      );
    }
  }

  private transition(from: ArticleStatus, action: ArticleAction): ArticleStatus {
    const to = nextArticleStatus(from, action);
    if (!to) {
      throw new DomainError(
        ErrorCode.INVALID_TRANSITION,
        `Cannot ${action.toLowerCase()} a ${from.toLowerCase()} article`,
        HttpStatus.CONFLICT,
      );
    }
    return to;
  }

  private async lock(tx: Tx, articleId: string): Promise<ArticleRow> {
    if (!isUuid(articleId)) throw new NotFoundError('Article not found');
    await tx.$queryRaw`SELECT 1 FROM app.articles WHERE id = ${articleId}::uuid FOR UPDATE`;
    return this.find(tx, articleId);
  }

  private async find(db: Tx | PrismaService, articleId: string): Promise<ArticleRow> {
    const row = isUuid(articleId)
      ? await db.article.findUnique({ where: { id: articleId }, include: withAuthor })
      : null;
    if (!row) throw new NotFoundError('Article not found');
    return row;
  }

  private requireStaff(actor: Actor | undefined, permission: string): StaffActor {
    if (!staffHas(actor, permission)) throw new ForbiddenError();
    return actor;
  }
}

/** Columns for the fields present in the input; absent fields are left as they are. */
function columns(data: Input) {
  const out: Partial<{
    topic: string;
    coverAltEn: string | null;
    coverAltAr: string | null;
    headlineEn: string;
    excerptEn: string | null;
    bodyEn: string;
    ctaLabelEn: string | null;
    headlineAr: string;
    excerptAr: string | null;
    bodyAr: string;
    ctaLabelAr: string | null;
    linkType: (typeof ARTICLE_LINK_TYPES)[number] | null;
    linkId: string | null;
  }> = {};
  if (data.category !== undefined) out.topic = data.category;
  if (data.cover_alt !== undefined) {
    out.coverAltEn = data.cover_alt.en || null;
    out.coverAltAr = data.cover_alt.ar || null;
  }
  if (data.en) {
    out.headlineEn = data.en.headline;
    out.excerptEn = data.en.excerpt || null;
    out.bodyEn = sanitizeArticleHtml(data.en.body);
    out.ctaLabelEn = data.en.cta_label || null;
  }
  if (data.ar) {
    out.headlineAr = data.ar.headline;
    out.excerptAr = data.ar.excerpt || null;
    out.bodyAr = sanitizeArticleHtml(data.ar.body);
    out.ctaLabelAr = data.ar.cta_label || null;
  }
  if (data.link !== undefined) {
    out.linkType = data.link?.type ?? null;
    out.linkId = data.link?.id ?? null;
  }
  return out;
}

function translation(
  headline: string | null,
  excerpt: string | null,
  body: string | null,
  cta: string | null,
): ArticleTranslationView | null {
  if (headline === null && body === null) return null;
  return { headline: headline ?? '', excerpt, body: body ?? '', ctaLabel: cta };
}

function view(row: ArticleRow): ArticleAdminView {
  return {
    id: row.id,
    slug: row.slug,
    topic: row.topic,
    coverUrl: null,
    coverAlt: row.coverAltEn || row.coverAltAr ? { en: row.coverAltEn ?? '', ar: row.coverAltAr ?? '' } : null,
    en: translation(row.headlineEn, row.excerptEn, row.bodyEn, row.ctaLabelEn),
    ar: translation(row.headlineAr, row.excerptAr, row.bodyAr, row.ctaLabelAr),
    link: row.linkType && row.linkId ? { type: row.linkType, id: row.linkId } : null,
    status: row.status,
    scheduledAt: row.scheduledAt,
    publishedAt: row.publishedAt,
    author: { id: row.authorStaffId, name: row.author.name },
    reads: row.reads,
    updatedAt: row.updatedAt,
  };
}
