/**
 * The single source of type rules (nest-module-map.md §4.22 "type policy map"). PROJECT is
 * a listing individuals apply to, unrelated to a company's portfolio projects (BQ-81,
 * decided 2026-11-20). SUPPLIER_REQUEST is company-facing (B2B).
 */
export const OPPORTUNITY_TYPES = ['JOB', 'PROJECT', 'CO_OP', 'VOLUNTEERING', 'SUPPLIER_REQUEST'] as const;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE'] as const;
export const WORK_SETUPS = ['ON_SITE', 'HYBRID', 'REMOTE'] as const;

interface TypeRule {
  /** Who applies (individuals) or responds (companies). */
  audience: 'INDIVIDUAL' | 'COMPANY';
  /** Only verified companies may submit it (BQ-80: JOB). */
  verifiedToSubmit: boolean;
  /** Only verified companies may create it at all (BQ-83: supplier requests, `CAPABILITY_REQUIRED`). */
  verifiedToCreate: boolean;
  /** Only students may apply (BQ-79: CO_OP, `NOT_ELIGIBLE` STUDENTS_ONLY). */
  studentsOnly: boolean;
  /** Pay is expected; the automated check warns when it is missing. */
  payExpected: boolean;
}

export const TYPE_RULES: Record<OpportunityType, TypeRule> = {
  JOB: {
    audience: 'INDIVIDUAL',
    verifiedToSubmit: true,
    verifiedToCreate: false,
    studentsOnly: false,
    payExpected: true,
  },
  PROJECT: {
    audience: 'INDIVIDUAL',
    verifiedToSubmit: false,
    verifiedToCreate: false,
    studentsOnly: false,
    payExpected: true,
  },
  CO_OP: {
    audience: 'INDIVIDUAL',
    verifiedToSubmit: false,
    verifiedToCreate: false,
    studentsOnly: true,
    payExpected: false,
  },
  VOLUNTEERING: {
    audience: 'INDIVIDUAL',
    verifiedToSubmit: false,
    verifiedToCreate: false,
    studentsOnly: false,
    payExpected: false,
  },
  SUPPLIER_REQUEST: {
    audience: 'COMPANY',
    verifiedToSubmit: false,
    verifiedToCreate: true,
    studentsOnly: false,
    payExpected: false,
  },
};

export const INDIVIDUAL_TYPES = OPPORTUNITY_TYPES.filter((t) => TYPE_RULES[t].audience === 'INDIVIDUAL');

/** The content a company writes (contracts/app `OpportunityInput`), as stored. */
export interface OpportunityContent {
  type: OpportunityType;
  title: string;
  city: string;
  summary: string;
  description: string;
  employmentType: (typeof EMPLOYMENT_TYPES)[number] | null;
  compensation: string | null;
  duration: string | null;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  supplierTypes: string[];
  closesAt: Date | null;
  workSetup: (typeof WORK_SETUPS)[number] | null;
}

/**
 * What a listing still needs before it can be submitted, keyed by request field
 * (contracts/app `OpportunityInput`: title, city, summary and description; employment type
 * for a JOB; at least one supplier type for a supplier request; a future closing time).
 */
export function submitGaps(content: OpportunityContent, now: Date): Record<string, string[]> {
  const gaps: Record<string, string[]> = {};
  const required = 'is required to submit';
  if (!content.title.trim()) gaps.title = [required];
  if (!content.city.trim()) gaps.city = [required];
  if (!content.summary.trim()) gaps.summary = [required];
  if (!content.description.trim()) gaps.description = [required];
  if (content.type === 'JOB' && !content.employmentType) gaps.employment_type = [required];
  if (content.type === 'SUPPLIER_REQUEST' && content.supplierTypes.length === 0) {
    gaps.supplier_types = ['needs at least one company type'];
  }
  if (content.closesAt && content.closesAt.getTime() <= now.getTime()) gaps.closes_at = ['must be in the future'];
  return gaps;
}

/** contracts/app `Error.reason` with `NOT_ELIGIBLE` when applying. */
export type ApplyRefusal = 'COMPANY_FACING' | 'INDIVIDUALS_ONLY' | 'CLOSED' | 'STUDENTS_ONLY';

/**
 * Whether this applicant may apply to this listing (docs/app/README.md §4 "Eligibility"),
 * checked in the contract's order. `open` is PUBLISHED and before `closes_at`; `student` is
 * read from the profile when applying. Null when eligible.
 */
export function applyRefusal(
  listing: { type: OpportunityType; open: boolean },
  applicant: { kind: 'member' | 'company'; student: boolean },
): ApplyRefusal | null {
  const rule = TYPE_RULES[listing.type];
  if (rule.audience === 'COMPANY') return 'COMPANY_FACING';
  if (applicant.kind !== 'member') return 'INDIVIDUALS_ONLY';
  if (!listing.open) return 'CLOSED';
  if (rule.studentsOnly && !applicant.student) return 'STUDENTS_ONLY';
  return null;
}
