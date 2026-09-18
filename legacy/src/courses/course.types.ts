import { ISODateString, UUID } from '../common/types';

export enum CourseStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
}

export enum EnrollmentStatus {
  Enrolled = 'enrolled',
  Completed = 'completed',
  Dropped = 'dropped',
}

export interface CourseEntity {
  id: UUID;
  title: string;
  description: string | null;
  instructor: string;
  thumbnail_url: string | null;
  duration_minutes: number;
  status: CourseStatus;
  points_reward: number;
  published_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CourseEnrollmentEntity {
  id: UUID;
  course_id: UUID;
  user_id: UUID;
  status: EnrollmentStatus;
  enrolled_at: ISODateString;
  completed_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}
