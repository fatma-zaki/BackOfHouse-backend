import type { CompanyCard } from '../../../modules/companies';
import type { OpportunityContent, OpportunityView } from '../../../modules/opportunities';

/** contracts/app `CompanySummary`. Logos arrive with uploads (1B). */
export function presentCompanySummary(c: CompanyCard) {
  return {
    id: c.id,
    name: c.name,
    company_type: c.companyType,
    logo_url: null,
    is_verified: c.isVerified,
    capabilities: c.capabilities,
  };
}

/** contracts/app `OpportunityInput` (a revision's draft). */
export function presentInput(c: OpportunityContent) {
  return {
    type: c.type,
    title: c.title,
    city: c.city,
    summary: c.summary,
    description: c.description,
    employment_type: c.employmentType,
    ...(c.compensation ? { compensation: c.compensation } : {}),
    ...(c.duration ? { duration: c.duration } : {}),
    responsibilities: c.responsibilities,
    requirements: c.requirements,
    skills: c.skills,
    supplier_types: c.supplierTypes,
    closes_at: c.closesAt?.toISOString() ?? null,
    work_setup: c.workSetup,
  };
}

/**
 * contracts/app `Opportunity`. REJECTED is not an app status: the company sees CLOSED with
 * the reviewer's note. There is no match score yet (`match_score` null; the app never
 * invents one); `my_application` is sent to individuals only.
 */
export function presentOpportunity(v: OpportunityView) {
  const c = v.content;
  return {
    id: v.id,
    type: c.type,
    status: v.status === 'REJECTED' ? 'CLOSED' : v.status,
    title: c.title,
    company: presentCompanySummary(v.company),
    city: c.city,
    summary: c.summary,
    description: c.description,
    posted_at: v.postedAt.toISOString(),
    closes_at: c.closesAt?.toISOString() ?? null,
    work_setup: c.workSetup,
    employment_type: c.employmentType,
    compensation: c.compensation,
    duration: c.duration,
    responsibilities: c.responsibilities,
    requirements: c.requirements,
    skills: c.skills,
    applicants: v.applicants,
    match_score: null,
    match_reasons: [] as string[],
    supplier_types: c.supplierTypes,
    ...(v.reviewerNote !== undefined ? { reviewer_note: v.reviewerNote } : {}),
    ...(v.revision !== undefined
      ? {
          revision: v.revision
            ? {
                status: v.revision.status,
                draft: presentInput(v.revision.draft),
                reviewer_note: v.revision.reviewerNote,
              }
            : null,
        }
      : {}),
    ...(v.myApplication !== undefined ? { my_application: v.myApplication } : {}),
  };
}
