import { ISODateString, UUID } from '../common/types';

export enum NotificationType {
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

export interface NotificationEntity {
  id: UUID;
  user_id: UUID;
  type: NotificationType;
  title: string;
  body: string | null;
  read: boolean;
  created_at: ISODateString;
}
