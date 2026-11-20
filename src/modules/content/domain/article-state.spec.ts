import { ARTICLE_STATUSES, ArticleAction, ArticleStatus, mustStayComplete, nextArticleStatus } from './article-state';

describe('article states', () => {
  // Every (status, action) pair: the expected next status, or null when refused.
  const table: Record<ArticleAction, Record<ArticleStatus, ArticleStatus | null>> = {
    PUBLISH: { DRAFT: 'PUBLISHED', SCHEDULED: 'PUBLISHED', PUBLISHED: null, UNPUBLISHED: 'PUBLISHED' },
    SCHEDULE: { DRAFT: 'SCHEDULED', SCHEDULED: 'SCHEDULED', PUBLISHED: null, UNPUBLISHED: 'SCHEDULED' },
    UNSCHEDULE: { DRAFT: null, SCHEDULED: 'DRAFT', PUBLISHED: null, UNPUBLISHED: null },
    UNPUBLISH: { DRAFT: null, SCHEDULED: null, PUBLISHED: 'UNPUBLISHED', UNPUBLISHED: null },
    RELEASE: { DRAFT: null, SCHEDULED: 'PUBLISHED', PUBLISHED: null, UNPUBLISHED: null },
  };

  const cases = (Object.keys(table) as ArticleAction[]).flatMap((action) =>
    ARTICLE_STATUSES.map((from) => [action, from, table[action][from]] as const),
  );

  it.each(cases)('%s from %s → %s', (action, from, to) => {
    expect(nextArticleStatus(from, action)).toBe(to);
  });

  it('keeps scheduled and live articles complete, not drafts', () => {
    expect(ARTICLE_STATUSES.filter(mustStayComplete)).toEqual(['SCHEDULED', 'PUBLISHED']);
  });
});
