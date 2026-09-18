export const API_PREFIX = 'api/v1';
export const SWAGGER_PATH = 'docs';
export const BEARER_AUTH_NAME = 'access-token';
export const JSON_BODY_LIMIT = '256kb';

/** Hard ceiling applied by the upload interceptor, independent of MAX_FILE_SIZE. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const PaginationDefaults = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/** Physical table names — kept in one place so queries never hard-code strings. */
export const Tables = {
  USERS: 'users',
  COMPANIES: 'companies',
  COMPANY_MEMBERS: 'company_members',
  PROFESSIONALS: 'professionals',
  EVENTS: 'events',
  EVENT_REGISTRATIONS: 'event_registrations',
  OPPORTUNITIES: 'opportunities',
  NEWS_ARTICLES: 'news_articles',
  NEWS_COMMENTS: 'news_comments',
  NEWS_REACTIONS: 'news_reactions',
  COURSES: 'courses',
  COURSE_ENROLLMENTS: 'course_enrollments',
  POINTS_TRANSACTIONS: 'points_transactions',
  POINT_BALANCES: 'point_balances',
  REWARDS: 'rewards',
  REWARD_REDEMPTIONS: 'reward_redemptions',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs',
} as const;

/** Postgres functions that wrap multi-table writes in a single transaction. */
export const RpcFunctions = {
  AWARD_POINTS: 'award_points',
  REDEEM_REWARD: 'redeem_reward',
  COMPLETE_COURSE: 'complete_course_enrollment',
  REGISTER_FOR_EVENT: 'register_for_event',
  CREATE_COMPANY_WITH_OWNER: 'create_company_with_owner',
  CANCEL_REDEMPTION: 'cancel_reward_redemption',
} as const;

export const StorageBuckets = {
  AVATARS: 'avatars',
  COMPANY_LOGOS: 'company-logos',
  EVENT_COVERS: 'event-covers',
  COURSE_THUMBNAILS: 'course-thumbnails',
} as const;

/** Columns a user may see about other users. Excludes email and phone (PII). */
export const PUBLIC_USER_COLUMNS =
  'id, first_name, last_name, avatar_url, bio, location, job_title, years_of_experience, created_at';
