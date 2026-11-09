import type { CompanyProjectView, CompanyStatsView, CompanyView } from '../../../modules/companies';
import type { ProfessionalView, ProfileProjectView, ProfileView } from '../../../modules/profiles';

/** contracts/app `Company` (CompanySummary + profile). Images arrive with uploads (1B). */
export function presentCompany(c: CompanyView) {
  return {
    id: c.id,
    name: c.name,
    company_type: c.companyType,
    logo_url: null,
    is_verified: c.isVerified,
    // Who may create supplier requests is open (BQ-83).
    capabilities: [] as string[],
    specialization: c.specialization,
    city: c.city,
    description: c.description,
    services: c.services,
    industries: c.industries,
    contact_email: c.contactEmail,
    contact_phone: c.contactPhone,
    website: c.website,
    cover_url: null,
    open_opportunities: c.openOpportunities,
    completed_projects: c.completedProjects,
    followers: c.followers,
    followed: c.followed,
  };
}

/** contracts/app `CompanyProject`. */
export function presentProject(p: CompanyProjectView) {
  return {
    id: p.id,
    company_id: p.companyId,
    title: p.title,
    description: p.description,
    location: p.location,
    category: p.category,
    started_at: p.startedAt,
    ended_at: p.endedAt,
    services: p.services,
    image_urls: [] as string[],
    client_name: p.clientName,
  };
}

/** contracts/app `CompanyStats`. */
export function presentStats(s: CompanyStatsView) {
  return {
    live_listings: s.liveListings,
    new_applicants: s.newApplicants,
    new_applicants_this_week: s.newApplicantsThisWeek,
    supplier_invites: s.supplierInvites,
    profile_views: s.profileViews,
    profile_views_change_percent: s.profileViewsChangePercent,
  };
}

/** contracts/app `ProfileProject`. Images arrive with uploads (1B). */
export function presentProfileProject(p: ProfileProjectView) {
  return { id: p.id, year: p.year, category: p.category, title: p.title, role: p.role, image_url: null };
}

/** contracts/app `Profile`. Experience and badges are empty until BQ-85 and Phase 6. */
export function presentProfile(p: ProfileView) {
  return {
    name: p.name,
    headline: p.headline,
    ...(p.company ? { company: p.company } : {}),
    city: p.city,
    ...(p.industry ? { industry: p.industry } : {}),
    about: p.about,
    profile_status: p.profileStatus,
    avatar_url: null,
    verified: p.verified,
    verification_level: p.verificationLevel,
    ...(p.availabilityNote ? { availability: p.availabilityNote } : {}),
    years_experience: 0,
    events_attended: 0,
    attendance_points: 0,
    experience: [] as unknown[],
    projects: p.projects.map(presentProfileProject),
    skills: p.skills,
    badges: [] as unknown[],
    interests: p.interests,
    contact_privacy: { share_email: p.contactPrivacy.shareEmail, share_phone: p.contactPrivacy.sharePhone },
  };
}

/** contracts/app `Professional`. */
export function presentProfessional(p: ProfessionalView) {
  return {
    id: p.id,
    name: p.name,
    role: p.role,
    company: p.company,
    city: p.city,
    years_experience: p.yearsExperience,
    skills: p.skills,
    availability: p.availability,
    avatar_url: null,
    verified: p.verified,
    connected: p.connected,
    field: p.field,
    student: p.student,
    highlighted: p.highlighted,
    match_score: null,
  };
}
