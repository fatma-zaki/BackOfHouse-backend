// Public API of the content module (nest-module-map.md §2.1 rule 1).
export { ContentModule } from './content.module';
export {
  ArticlesService,
  ARTICLE_LINK_TYPES,
  NEWS_TOPICS,
  type ArticleAdminView,
  type ArticleForChecks,
  type ArticleTranslationView,
} from './services/articles.service';
export { NewsService, NEWS_SOURCE, type ArticleCommentView, type NewsArticleView } from './services/news.service';
export { intrinsicChecks, type ArticleCheck } from './domain/article-checks';
export { articlePlainText, type ArticleBlock } from './domain/article-html';
