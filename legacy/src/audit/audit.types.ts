import { ISODateString, UUID } from '../common/types';

/** Security- and business-relevant actions worth keeping a record of. */
export enum AuditAction {
  SIGNUP = 'SIGNUP',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_UPDATE = 'PASSWORD_UPDATE',
  COMPANY_CREATED = 'COMPANY_CREATED',
  COMPANY_UPDATED = 'COMPANY_UPDATED',
  COMPANY_DELETED = 'COMPANY_DELETED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  NEWS_CREATED = 'NEWS_CREATED',
  NEWS_UPDATED = 'NEWS_UPDATED',
  NEWS_DELETED = 'NEWS_DELETED',
  COMMENT_MODERATED = 'COMMENT_MODERATED',
  COURSE_CREATED = 'COURSE_CREATED',
  COURSE_UPDATED = 'COURSE_UPDATED',
  COURSE_DELETED = 'COURSE_DELETED',
  REWARD_CREATED = 'REWARD_CREATED',
  REWARD_UPDATED = 'REWARD_UPDATED',
  REWARD_DELETED = 'REWARD_DELETED',
  REWARD_REDEEMED = 'REWARD_REDEEMED',
  REDEMPTION_FULFILLED = 'REDEMPTION_FULFILLED',
  REDEMPTION_CANCELLED = 'REDEMPTION_CANCELLED',
  POINTS_ADJUSTED = 'POINTS_ADJUSTED',
  FILE_UPLOADED = 'FILE_UPLOADED',
  FILE_DELETED = 'FILE_DELETED',
}

export interface AuditLogEntry {
  /** Profile id of whoever performed the action. */
  actor_id: UUID;
  action: AuditAction;
  entity_type: string;
  entity_id?: UUID;
  /** Contextual detail only — never credentials, tokens or secrets. */
  metadata?: Record<string, unknown>;
}

export interface AuditLogRecord extends Required<Omit<AuditLogEntry, 'entity_id'>> {
  id: UUID;
  entity_id: UUID | null;
  created_at: ISODateString;
}
