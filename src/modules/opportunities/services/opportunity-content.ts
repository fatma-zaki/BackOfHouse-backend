import { z } from 'zod';
import { ValidationFailedError } from '../../../common/errors';
import type { Prisma } from '../../../generated/prisma/client';
import {
  EMPLOYMENT_TYPES,
  OPPORTUNITY_TYPES,
  OpportunityContent,
  OpportunityType,
  WORK_SETUPS,
} from '../domain/opportunity-type.policy';

/** contracts/app `CompanyType` (the types a supplier request invites). */
export const COMPANY_TYPES = [
  'EVENT_ORGANIZER',
  'SUPPLIER',
  'VENUE',
  'PRODUCTION',
  'AGENCY',
  'SERVICE_PROVIDER',
  'OTHER',
] as const;

const line = (max: number) => z.string().trim().max(max);
const list = (items: number, max: number) =>
  z.array(z.string().trim().min(1, 'must not be empty').max(max)).max(items, `must have at most ${items} items`);

/**
 * contracts/app `OpportunityInput`. Drafts may be incomplete; `submitGaps` checks the
 * listing when it is submitted. Fields left out keep their value.
 */
export const opportunityInputSchema = z
  .object({
    type: z.enum(OPPORTUNITY_TYPES),
    title: line(120).optional(),
    city: line(100).optional(),
    summary: line(200).optional(),
    description: z.string().trim().max(5000).optional(),
    employment_type: z.enum(EMPLOYMENT_TYPES).nullable().optional(),
    compensation: line(100).nullable().optional(),
    duration: line(100).nullable().optional(),
    responsibilities: list(20, 300).optional(),
    requirements: list(20, 300).optional(),
    skills: list(30, 60).optional(),
    supplier_types: z
      .array(z.enum(COMPANY_TYPES))
      .refine((items) => new Set(items).size === items.length, 'must not repeat a type')
      .optional(),
    closes_at: z.string().datetime({ offset: true }).nullable().optional(),
    work_setup: z.enum(WORK_SETUPS).nullable().optional(),
  })
  .strict();

export type OpportunityInput = z.infer<typeof opportunityInputSchema>;

export const EMPTY_CONTENT = (type: OpportunityType): OpportunityContent => ({
  type,
  title: '',
  city: '',
  summary: '',
  description: '',
  employmentType: null,
  compensation: null,
  duration: null,
  responsibilities: [],
  requirements: [],
  skills: [],
  supplierTypes: [],
  closesAt: null,
  workSetup: null,
});

/** `base` with the fields present in `input`. Type-specific fields are refused on other types. */
export function mergeInput(base: OpportunityContent, input: OpportunityInput): OpportunityContent {
  const errors: Record<string, string[]> = {};
  if (input.type !== base.type) errors.type = ['cannot change'];
  if (input.employment_type && base.type !== 'JOB') errors.employment_type = ['is only for jobs'];
  if (input.supplier_types?.length && base.type !== 'SUPPLIER_REQUEST') {
    errors.supplier_types = ['is only for supplier requests'];
  }
  if (input.work_setup && base.type === 'SUPPLIER_REQUEST') errors.work_setup = ['is not used by supplier requests'];
  if (Object.keys(errors).length > 0) throw new ValidationFailedError(errors);
  const pick = <T>(value: T | undefined, current: T) => (value === undefined ? current : value);
  return {
    type: base.type,
    title: pick(input.title, base.title),
    city: pick(input.city, base.city),
    summary: pick(input.summary, base.summary),
    description: pick(input.description, base.description),
    employmentType: pick(input.employment_type, base.employmentType),
    compensation: input.compensation === undefined ? base.compensation : input.compensation || null,
    duration: input.duration === undefined ? base.duration : input.duration || null,
    responsibilities: pick(input.responsibilities, base.responsibilities),
    requirements: pick(input.requirements, base.requirements),
    skills: pick(input.skills, base.skills),
    supplierTypes: pick(input.supplier_types, base.supplierTypes),
    closesAt: input.closes_at === undefined ? base.closesAt : input.closes_at ? new Date(input.closes_at) : null,
    workSetup: pick(input.work_setup, base.workSetup),
  };
}

type ContentRow = Pick<
  Prisma.OpportunityGetPayload<object>,
  | 'type'
  | 'title'
  | 'city'
  | 'summary'
  | 'description'
  | 'employmentType'
  | 'compensation'
  | 'duration'
  | 'responsibilities'
  | 'requirements'
  | 'skills'
  | 'supplierTypes'
  | 'closesAt'
  | 'workSetup'
>;

/** The live content of a row. */
export function contentOf(row: ContentRow): OpportunityContent {
  return {
    type: row.type,
    title: row.title,
    city: row.city,
    summary: row.summary,
    description: row.description,
    employmentType: row.employmentType,
    compensation: row.compensation,
    duration: row.duration,
    responsibilities: row.responsibilities ?? [],
    requirements: row.requirements ?? [],
    skills: row.skills ?? [],
    supplierTypes: row.supplierTypes ?? [],
    closesAt: row.closesAt,
    workSetup: row.workSetup,
  };
}

/** Columns for content (create, update, approving a revision). */
export function contentColumns(content: OpportunityContent) {
  return {
    title: content.title,
    city: content.city,
    summary: content.summary,
    description: content.description,
    employmentType: content.employmentType,
    compensation: content.compensation,
    duration: content.duration,
    responsibilities: content.responsibilities,
    requirements: content.requirements,
    skills: content.skills,
    supplierTypes: content.supplierTypes as (typeof COMPANY_TYPES)[number][],
    closesAt: content.closesAt,
    workSetup: content.workSetup,
  };
}

/** A revision as stored in `revision_draft` (contracts/app `OpportunityInput` names). */
export function draftJson(content: OpportunityContent): Prisma.InputJsonObject {
  return {
    type: content.type,
    title: content.title,
    city: content.city,
    summary: content.summary,
    description: content.description,
    employment_type: content.employmentType,
    compensation: content.compensation,
    duration: content.duration,
    responsibilities: content.responsibilities,
    requirements: content.requirements,
    skills: content.skills,
    supplier_types: content.supplierTypes,
    closes_at: content.closesAt?.toISOString() ?? null,
    work_setup: content.workSetup,
  };
}

/** The stored revision back as content (written only by `draftJson`). */
export function draftContent(json: unknown, type: OpportunityType): OpportunityContent {
  const d = (json ?? {}) as Record<string, unknown>;
  const text = (key: string) => (typeof d[key] === 'string' ? (d[key] as string) : '');
  const maybe = (key: string) => (typeof d[key] === 'string' && d[key] !== '' ? (d[key] as string) : null);
  const strings = (key: string) =>
    (Array.isArray(d[key]) ? (d[key] as unknown[]).filter((v) => typeof v === 'string') : []) as string[];
  return {
    type,
    title: text('title'),
    city: text('city'),
    summary: text('summary'),
    description: text('description'),
    employmentType: maybe('employment_type') as OpportunityContent['employmentType'],
    compensation: maybe('compensation'),
    duration: maybe('duration'),
    responsibilities: strings('responsibilities'),
    requirements: strings('requirements'),
    skills: strings('skills'),
    supplierTypes: strings('supplier_types'),
    closesAt: maybe('closes_at') ? new Date(maybe('closes_at')!) : null,
    workSetup: maybe('work_setup') as OpportunityContent['workSetup'],
  };
}

/** Fields that differ between the live content and a revision (the review "diff"). */
export function contentChanges(
  live: OpportunityContent,
  next: OpportunityContent,
): { field: string; before: unknown; after: unknown }[] {
  const a = draftJson(live);
  const b = draftJson(next);
  return Object.keys(b)
    .filter((key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]))
    .map((field) => ({ field, before: a[field] ?? null, after: b[field] ?? null }));
}
