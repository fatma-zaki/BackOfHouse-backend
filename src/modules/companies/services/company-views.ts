import type { Company, CompanyProject } from '../../../generated/prisma/client';

/** A company's public profile (contracts/app `Company`). */
export interface CompanyView {
  id: string;
  name: string;
  companyType: string;
  isVerified: boolean;
  specialization: string;
  city: string;
  description: string;
  services: string[];
  industries: string[];
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  openOpportunities: number;
  completedProjects: number;
  followers: number;
  /** Whether the viewer follows it (false for the company itself). */
  followed: boolean;
}

/** A portfolio project (contracts/app `CompanyProject`). */
export interface CompanyProjectView {
  id: string;
  companyId: string;
  title: string;
  description: string;
  location: string;
  category: string;
  startedAt: string;
  endedAt: string | null;
  services: string[];
  clientName: string | null;
}

const isoDate = (value: Date) => value.toISOString().slice(0, 10);

export function companyView(company: Company, counts: { projects: number; followed: boolean }): CompanyView {
  return {
    id: company.id,
    name: company.name,
    companyType: company.companyType,
    isVerified: company.verifiedAt !== null,
    specialization: company.specialization,
    city: company.city,
    description: company.description,
    services: company.services ?? [],
    industries: company.industries ?? [],
    contactEmail: company.contactEmail,
    contactPhone: company.contactPhone,
    website: company.website,
    // Opportunities arrive in Phase 5.
    openOpportunities: 0,
    completedProjects: counts.projects,
    followers: company.followersCount,
    followed: counts.followed,
  };
}

export function projectView(project: CompanyProject): CompanyProjectView {
  return {
    id: project.id,
    companyId: project.companyId,
    title: project.title,
    description: project.description,
    location: project.location,
    category: project.category,
    startedAt: isoDate(project.startedAt),
    endedAt: project.endedAt ? isoDate(project.endedAt) : null,
    services: project.services ?? [],
    clientName: project.clientName,
  };
}
