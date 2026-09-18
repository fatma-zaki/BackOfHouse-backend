import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';
import {
  CreateCommentDto,
  CreateNewsArticleDto,
  ModerateCommentDto,
  UpsertReactionDto,
  UpdateNewsArticleDto,
} from './dto/news.dto';
import {
  CommentStatus,
  NewsArticleEntity,
  NewsCommentEntity,
  NewsReactionEntity,
  NewsStatus,
} from './news.types';
import { AuthContext } from '../auth/types/auth-context';
import { Permission, hasPermission } from '../auth/decorators/permissions.enum';
import { Tables } from '../common/constants';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalOperationException,
  NotFoundException,
} from '../common/exceptions/business.exceptions';
import { ListResult, PaginationParams, UUID } from '../common/types';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { buildSearchFilter, resolveSort, sanitizeSearchTerm } from '../common/utils/query.util';
import { hasUpdates, pickDefined } from '../common/utils/update.util';

const EDITABLE_FIELDS = ['title', 'body', 'excerpt', 'cover_image_url', 'status'] as const;
const SEARCHABLE_COLUMNS = ['title', 'excerpt'] as const;
const SORTABLE_COLUMNS = ['published_at', 'title'] as const;
const UNIQUE_VIOLATION = '23505';

/**
 * News is first-party publishing, not a community feed.
 *
 * Articles are written by the platform (NEWS_PUBLISH) and members interact with
 * them through comments and reactions only. Comment moderation is a separate
 * permission so that hiding abuse never implies the ability to publish.
 */
@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async createArticle(context: AuthContext, dto: CreateNewsArticleDto): Promise<NewsArticleEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.NEWS_ARTICLES)
      .insert({
        title: dto.title,
        slug: dto.slug,
        body: dto.body,
        excerpt: dto.excerpt ?? null,
        cover_image_url: dto.cover_image_url ?? null,
        author_id: context.profileId,
        status: NewsStatus.Draft,
      })
      .select('*')
      .single<NewsArticleEntity>();

    if (error || !data) {
      if (error?.code === UNIQUE_VIOLATION) {
        throw new ConflictException('An article with this slug already exists');
      }
      this.logger.error(`Failed to create article: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to create the article');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.NEWS_CREATED,
      entity_type: 'news_article',
      entity_id: data.id,
    });

    return data;
  }

  async findAll(
    query: PaginationQueryDto,
    pagination: PaginationParams,
  ): Promise<ListResult<NewsArticleEntity>> {
    const sort = resolveSort(query.sortBy, query.sortOrder, SORTABLE_COLUMNS, {
      column: 'published_at',
      ascending: false,
    });

    let request = this.databaseService.admin
      .from(Tables.NEWS_ARTICLES)
      .select('*', { count: 'exact' })
      .eq('status', NewsStatus.Published);

    const search = sanitizeSearchTerm(query.search);
    if (search) {
      request = request.or(buildSearchFilter(SEARCHABLE_COLUMNS, search));
    }

    const { data, error, count } = await request
      .order(sort.column, { ascending: sort.ascending })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      this.logger.error(`Failed to list articles: ${error.message}`);
      throw new InternalOperationException('Unable to list articles');
    }

    return { data: (data ?? []) as NewsArticleEntity[], total: count ?? 0 };
  }

  /** Unpublished articles are visible only to editors. */
  async findById(id: UUID, context: AuthContext): Promise<NewsArticleEntity> {
    const article = await this.loadArticle(id);

    if (article.status !== NewsStatus.Published && !this.canPublish(context)) {
      throw new NotFoundException('Article', id);
    }

    return article;
  }

  async updateArticle(
    id: UUID,
    dto: UpdateNewsArticleDto,
    context: AuthContext,
  ): Promise<NewsArticleEntity> {
    const article = await this.loadArticle(id);

    const payload = pickDefined(dto, EDITABLE_FIELDS);
    if (!hasUpdates(payload)) {
      return article;
    }

    if (dto.status === NewsStatus.Published && !article.published_at) {
      payload['published_at'] = new Date().toISOString();
    }

    const { data, error } = await this.databaseService.admin
      .from(Tables.NEWS_ARTICLES)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single<NewsArticleEntity>();

    if (error || !data) {
      this.logger.error(`Failed to update article ${id}: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to update the article');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.NEWS_UPDATED,
      entity_type: 'news_article',
      entity_id: id,
      metadata: { fields: Object.keys(payload) },
    });

    return data;
  }

  async removeArticle(id: UUID, context: AuthContext): Promise<void> {
    await this.loadArticle(id);

    const { error } = await this.databaseService.admin
      .from(Tables.NEWS_ARTICLES)
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to delete article ${id}: ${error.message}`);
      throw new InternalOperationException('Unable to delete the article');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.NEWS_DELETED,
      entity_type: 'news_article',
      entity_id: id,
    });
  }

  async addComment(
    articleId: UUID,
    context: AuthContext,
    dto: CreateCommentDto,
  ): Promise<NewsCommentEntity> {
    const article = await this.loadArticle(articleId);

    if (article.status !== NewsStatus.Published) {
      throw new BadRequestException('Comments are only allowed on published articles');
    }

    const { data, error } = await this.databaseService.admin
      .from(Tables.NEWS_COMMENTS)
      .insert({
        article_id: articleId,
        user_id: context.profileId,
        body: dto.body,
        status: CommentStatus.Visible,
      })
      .select('*')
      .single<NewsCommentEntity>();

    if (error || !data) {
      this.logger.error(`Failed to add comment: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to add the comment');
    }

    return data;
  }

  async listComments(
    articleId: UUID,
    context: AuthContext,
    pagination: PaginationParams,
  ): Promise<ListResult<NewsCommentEntity>> {
    await this.findById(articleId, context);

    const { data, error, count } = await this.databaseService.admin
      .from(Tables.NEWS_COMMENTS)
      .select('*', { count: 'exact' })
      .eq('article_id', articleId)
      .eq('status', CommentStatus.Visible)
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      this.logger.error(`Failed to list comments: ${error.message}`);
      throw new InternalOperationException('Unable to list comments');
    }

    return { data: (data ?? []) as NewsCommentEntity[], total: count ?? 0 };
  }

  /** A member may delete their own comment; a moderator may delete any. */
  async removeComment(commentId: UUID, context: AuthContext): Promise<void> {
    const comment = await this.loadComment(commentId);
    const isAuthor = comment.user_id === context.profileId;

    if (!isAuthor && !hasPermission(context.role, Permission.NEWS_MODERATE)) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    const { error } = await this.databaseService.admin
      .from(Tables.NEWS_COMMENTS)
      .delete()
      .eq('id', commentId);

    if (error) {
      this.logger.error(`Failed to delete comment ${commentId}: ${error.message}`);
      throw new InternalOperationException('Unable to delete the comment');
    }

    if (!isAuthor) {
      await this.auditService.log({
        actor_id: context.profileId,
        action: AuditAction.COMMENT_MODERATED,
        entity_type: 'news_comment',
        entity_id: commentId,
        metadata: { operation: 'delete' },
      });
    }
  }

  async moderateComment(
    commentId: UUID,
    dto: ModerateCommentDto,
    context: AuthContext,
  ): Promise<NewsCommentEntity> {
    await this.loadComment(commentId);

    const { data, error } = await this.databaseService.admin
      .from(Tables.NEWS_COMMENTS)
      .update({ status: dto.status })
      .eq('id', commentId)
      .select('*')
      .single<NewsCommentEntity>();

    if (error || !data) {
      this.logger.error(`Failed to moderate comment ${commentId}: ${error?.message ?? 'no row'}`);
      throw new InternalOperationException('Unable to moderate the comment');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.COMMENT_MODERATED,
      entity_type: 'news_comment',
      entity_id: commentId,
      metadata: { status: dto.status },
    });

    return data;
  }

  /** One reaction per member per article; re-reacting replaces the previous type. */
  async upsertReaction(
    articleId: UUID,
    context: AuthContext,
    dto: UpsertReactionDto,
  ): Promise<NewsReactionEntity> {
    await this.findById(articleId, context);

    const { data, error } = await this.databaseService.admin
      .from(Tables.NEWS_REACTIONS)
      .upsert(
        { article_id: articleId, user_id: context.profileId, type: dto.type },
        { onConflict: 'article_id,user_id' },
      )
      .select('*')
      .single<NewsReactionEntity>();

    if (error || !data) {
      this.logger.error(`Failed to save reaction: ${error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to save the reaction');
    }

    return data;
  }

  async removeReaction(articleId: UUID, context: AuthContext): Promise<void> {
    const { error } = await this.databaseService.admin
      .from(Tables.NEWS_REACTIONS)
      .delete()
      .eq('article_id', articleId)
      .eq('user_id', context.profileId);

    if (error) {
      this.logger.error(`Failed to remove reaction: ${error.message}`);
      throw new InternalOperationException('Unable to remove the reaction');
    }
  }

  private canPublish(context: AuthContext): boolean {
    return hasPermission(context.role, Permission.NEWS_PUBLISH);
  }

  private async loadArticle(id: UUID): Promise<NewsArticleEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.NEWS_ARTICLES)
      .select('*')
      .eq('id', id)
      .maybeSingle<NewsArticleEntity>();

    if (error) {
      this.logger.error(`Failed to load article ${id}: ${error.message}`);
      throw new InternalOperationException('Unable to load the article');
    }

    if (!data) {
      throw new NotFoundException('Article', id);
    }

    return data;
  }

  private async loadComment(id: UUID): Promise<NewsCommentEntity> {
    const { data, error } = await this.databaseService.admin
      .from(Tables.NEWS_COMMENTS)
      .select('*')
      .eq('id', id)
      .maybeSingle<NewsCommentEntity>();

    if (error) {
      this.logger.error(`Failed to load comment ${id}: ${error.message}`);
      throw new InternalOperationException('Unable to load the comment');
    }

    if (!data) {
      throw new NotFoundException('Comment', id);
    }

    return data;
  }
}
