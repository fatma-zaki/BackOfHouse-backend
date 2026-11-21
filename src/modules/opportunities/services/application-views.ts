import { Prisma } from '../../../generated/prisma/client';
import type { PrismaService, Tx } from '../../../platform/database';
import type { ExperienceView, ProfileProjectView } from '../../profiles';
import type { ApplicationStatus } from '../domain/application-status.policy';
import type { OpportunityType } from '../domain/opportunity-type.policy';

/** contracts/app `ApplicantSnapshot`: the public profile at submission, never contact details. */
export interface ApplicantSnapshot {
  name: string;
  headline: string;
  profileStatus: 'PROFESSIONAL' | 'STUDENT';
  verified: boolean;
  city: string;
  skills: string[];
}

/** The listing as it was when the member applied. */
export interface ListingSnapshot {
  title: string;
  type: OpportunityType;
  city: string;
  employmentType: string | null;
  compensation: string | null;
}

/** An application, before presentation (contracts/app `Application` and `ApplicantView`). */
export interface ApplicationView {
  id: string;
  reference: string;
  opportunityId: string;
  companyId: string;
  applicantUserId: string;
  listing: ListingSnapshot;
  status: ApplicationStatus;
  message: string | null;
  applicant: ApplicantSnapshot;
  experience: ExperienceView[];
  projects: ProfileProjectView[];
  submittedAt: Date;
  statusChangedAt: Date;
  updatedAt: Date;
}

export const applicationInclude = { opportunity: { select: { companyId: true } } } as const;

export type ApplicationRow = Prisma.ApplicationGetPayload<{ include: typeof applicationInclude }>;

/** AP-1001, AP-1002, ... */
export const referenceOf = (number: number): string => `AP-${1000 + number}`;

export function applicationView(row: ApplicationRow): ApplicationView {
  return {
    id: row.id,
    reference: referenceOf(row.number),
    opportunityId: row.opportunityId,
    companyId: row.opportunity.companyId,
    applicantUserId: row.applicantUserId,
    listing: row.listing as unknown as ListingSnapshot,
    status: row.status,
    message: row.message,
    applicant: row.applicant as unknown as ApplicantSnapshot,
    experience: row.experience as unknown as ExperienceView[],
    projects: row.projects as unknown as ProfileProjectView[],
    submittedAt: row.submittedAt,
    statusChangedAt: row.statusChangedAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * contracts/app `Opportunity.applicants`, per listing: applications that were not
 * withdrawn, or for a supplier request its responses (a listing only ever has one kind).
 */
export async function applicationCounts(
  db: PrismaService | Tx,
  opportunityIds: string[],
): Promise<Map<string, number>> {
  if (opportunityIds.length === 0) return new Map();
  const [applications, responses] = await Promise.all([
    db.application.groupBy({
      by: ['opportunityId'],
      where: { opportunityId: { in: opportunityIds }, status: { not: 'WITHDRAWN' } },
      _count: true,
    }),
    db.supplierResponse.groupBy({ by: ['requestId'], where: { requestId: { in: opportunityIds } }, _count: true }),
  ]);
  return new Map([
    ...applications.map((r) => [r.opportunityId, r._count] as const),
    ...responses.map((r) => [r.requestId, r._count] as const),
  ]);
}
