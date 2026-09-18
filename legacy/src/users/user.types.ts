import { ISODateString, UUID } from '../common/types';

export enum UserStatus {
  Active = 'active',
  Suspended = 'suspended',
  Deleted = 'deleted',
}

/** Full profile row. Contains PII and is only returned to the owner or an admin. */
export interface UserEntity {
  id: UUID;
  auth_user_id: UUID;
  email: string;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  job_title: string | null;
  years_of_experience: number;
  status: UserStatus;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/** Projection shown to other members of the ecosystem: no email, no phone. */
export interface PublicUserProfile {
  id: UUID;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  job_title: string | null;
  years_of_experience: number;
  created_at: ISODateString;
}
