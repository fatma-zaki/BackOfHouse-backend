import { ISODateString, UUID } from '../common/types';

export enum AvailabilityStatus {
  Available = 'available',
  Busy = 'busy',
  Unavailable = 'unavailable',
}

export enum ProfileVisibility {
  Public = 'public',
  Private = 'private',
  Connections = 'connections',
}

export interface ProfessionalEntity {
  id: UUID;
  user_id: UUID;
  profession: string;
  specialties: string[];
  skills: string[];
  experience: number;
  location: string | null;
  availability: AvailabilityStatus;
  portfolio_links: string[];
  profile_visibility: ProfileVisibility;
  created_at: ISODateString;
  updated_at: ISODateString;
}
