import { Injectable } from '@nestjs/common';
import type { Actor } from '../../../common/context/actor';
import { CompaniesService } from '../../companies';
import { ArticleCheck, ArticlesService, articlePlainText, intrinsicChecks } from '../../content';

/**
 * The pre-publish checklist (contracts/admin GET /articles/{id}/checks, hand-off rules §9):
 * both languages complete, cover alt text, headline length (from the content module), plus
 * the checks that need other modules: the linked item is live, and a warning when a company
 * on the platform is named, so news does not read as an ad. Only TRANSLATION_MISSING blocks
 * publishing; the rest guide the editor.
 */
@Injectable()
export class ArticleChecksService {
  constructor(
    private readonly articles: ArticlesService,
    private readonly companies: CompaniesService,
  ) {}

  async checks(actor: Actor | undefined, articleId: string): Promise<ArticleCheck[]> {
    const article = await this.articles.forChecks(actor, articleId);
    const [own, linked, named] = await Promise.all([
      Promise.resolve(intrinsicChecks(article)),
      this.linkedItem(article.link),
      this.companies.namedIn(
        (['en', 'ar'] as const)
          .flatMap((lang) => [
            article[lang].headline ?? '',
            article[lang].excerpt ?? '',
            articlePlainText(article[lang].body ?? ''),
          ])
          .join('\n'),
      ),
    ]);
    const [languages, coverAlt, headline] = own;
    const partner: ArticleCheck =
      named.length > 0
        ? {
            key: 'PARTNER_MENTION',
            result: 'WARN',
            message: `Names ${named.join(', ')}; make sure it does not read as an ad`,
          }
        : { key: 'PARTNER_MENTION', result: 'PASS', message: 'No company on the platform is named' };
    return [languages, coverAlt, linked, headline, partner];
  }

  private async linkedItem(link: { type: string; id: string } | null): Promise<ArticleCheck> {
    if (!link) return { key: 'LINKED_ITEM_LIVE', result: 'PASS', message: 'Nothing is linked' };
    if (link.type === 'COMPANY') {
      return (await this.companies.isLive(link.id))
        ? { key: 'LINKED_ITEM_LIVE', result: 'PASS', message: 'The linked company is listed' }
        : { key: 'LINKED_ITEM_LIVE', result: 'FAIL', message: 'The linked company is missing or suspended' };
    }
    // Opportunities (Phase 5) and events (Phase 6) are not built yet.
    return {
      key: 'LINKED_ITEM_LIVE',
      result: 'WARN',
      message: `Linked ${link.type.toLowerCase()}s cannot be checked yet`,
    };
  }
}
