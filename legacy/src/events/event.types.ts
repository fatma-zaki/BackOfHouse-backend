import { ISODateString, UUID } from '../common/types';

export enum EventStatus {
  Draft = 'draft',
  Published = 'published',
  Cancelled = 'cancelled',
  Completed = 'completed',
}

export enum RegistrationStatus {
  Registered = 'registered',
  Waitlisted = 'waitlisted',
  Cancelled = 'cancelled',
  Attended = 'attended',
}

export interface EventEntity {
  id: UUID;
  title: string;
  slug: string;
  description: string | null;
  organizer: string;
  location: string | null;
  start_date: ISODateString;
  end_date: ISODateString;
  status: EventStatus;
  cover_image_url: string | null;
  capacity: number | null;
  created_by: UUID | null;
  company_id: UUID | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface EventRegistrationEntity {
  id: UUID;
  event_id: UUID;
  user_id: UUID;
  status: RegistrationStatus;
  created_at: ISODateString;
  updated_at: ISODateString;
}
