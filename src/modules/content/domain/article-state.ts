/**
 * Editorial states of an article (contracts/admin `ArticleAdmin.status`). This table is the
 * only way between them; every transition is unit-tested.
 *
 * - DRAFT: being written; never shown in the app.
 * - SCHEDULED: goes live at `scheduled_at` (the `article.publish` job).
 * - PUBLISHED: live in the app.
 * - UNPUBLISHED: taken down; may be scheduled or published again.
 */
export const ARTICLE_STATUSES = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED'] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export type ArticleAction = 'PUBLISH' | 'SCHEDULE' | 'UNSCHEDULE' | 'UNPUBLISH' | 'RELEASE';

const TRANSITIONS: Record<ArticleAction, { from: readonly ArticleStatus[]; to: ArticleStatus }> = {
  /** Publish now (POST /articles/{id}/schedule without a time). */
  PUBLISH: { from: ['DRAFT', 'SCHEDULED', 'UNPUBLISHED'], to: 'PUBLISHED' },
  /** Publish later; a scheduled article may be moved to another time. */
  SCHEDULE: { from: ['DRAFT', 'SCHEDULED', 'UNPUBLISHED'], to: 'SCHEDULED' },
  /** Back to draft. */
  UNSCHEDULE: { from: ['SCHEDULED'], to: 'DRAFT' },
  UNPUBLISH: { from: ['PUBLISHED'], to: 'UNPUBLISHED' },
  /** The job publishes a scheduled article whose time has come. */
  RELEASE: { from: ['SCHEDULED'], to: 'PUBLISHED' },
};

/** The status after `action`, or null when it is not allowed from `from`. */
export function nextArticleStatus(from: ArticleStatus, action: ArticleAction): ArticleStatus | null {
  const transition = TRANSITIONS[action];
  return transition.from.includes(from) ? transition.to : null;
}

/** Scheduled and live articles must keep both languages complete when edited. */
export function mustStayComplete(status: ArticleStatus): boolean {
  return status === 'SCHEDULED' || status === 'PUBLISHED';
}
