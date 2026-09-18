import { ISODateString, UUID } from '../common/types';

export enum CompanyStatus {
  Active = 'active',
  Inactive = 'inactive',
  Suspended = 'suspended',
}

/**
 * Authority a user holds over one specific company.
 * This is the resource-level counterpart to the platform-wide `Role`.
 */
export enum CompanyRole {
  Admin = 'admin',
  Member = 'member',
}

export interface CompanyEntity {
  id: UUID;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  description: string | null;
  website: string | null;
  industry: string | null;
  location: string | null;
  status: CompanyStatus;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CompanyMemberEntity {
  id: UUID;
  company_id: UUID;
  user_id: UUID;
  role: CompanyRole;
  created_at: ISODateString;
  updated_at: ISODateString;
}
