import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { RequestContext } from '../../../common/context/request-context';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AppPageMeta, AppPaginationQueryDto, Page } from '../../../common/pagination';
import { ArticleCommentView, NEWS_TOPICS, NewsArticleView, NewsService } from '../../../modules/content';

/** contracts/app GET /news query. */
export class NewsListQueryDto extends AppPaginationQueryDto {
  @ApiPropertyOptional({ enum: ['FOR_YOU', 'LATEST'], default: 'FOR_YOU' })
  @IsOptional()
  @IsIn(['FOR_YOU', 'LATEST'])
  order?: 'FOR_YOU' | 'LATEST';

  @ApiPropertyOptional({ enum: NEWS_TOPICS })
  @IsOptional()
  @IsIn(NEWS_TOPICS)
  topic?: string;

  @ApiPropertyOptional({ description: 'Free-text search, case-insensitive' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };

const pageOf = <T>(items: T[], hasMore: boolean, query: { page: number; page_size: number }) =>
  new Page<T, AppPageMeta>(items, { page: query.page, page_size: query.page_size, has_more: hasMore });

/** contracts/app `Article`. Lists leave out `body`, `directives` and `keywords`. */
function presentArticle(a: NewsArticleView) {
  return {
    id: a.id,
    topic: a.topic,
    category: a.category,
    title: a.title,
    summary: a.summary,
    source: a.source,
    teaser: a.teaser,
    read_minutes: a.readMinutes,
    published_at: a.publishedAt.toISOString(),
    image_url: null,
    image_caption: a.imageCaption,
    breaking: a.breaking,
    labels: [] as string[],
    // Decided (BQ-91a, 2026-11-18): the editor's name is for the back office only; the app
    // shows articles as from Back of House.
    author: null,
    ...(a.body ? { body: a.body, directives: [] as string[], keywords: [] as string[] } : {}),
    saved: a.saved,
    like_count: a.likeCount,
    liked: a.liked,
    comment_count: a.commentCount,
  };
}

/** contracts/app `ArticleComment`. */
function presentComment(c: ArticleCommentView) {
  return {
    id: c.id,
    article_id: c.articleId,
    author_name: c.authorName,
    author_headline: c.authorHeadline,
    author_avatar_url: null,
    text: c.text,
    created_at: c.createdAt.toISOString(),
    mine: c.mine,
  };
}

/**
 * Editorial news (contracts/app /news*). Individuals and Company Accounts read, save and
 * read comments; only individuals like and comment (403 `ENGAGEMENT_NOT_ALLOWED`).
 */
@ApiTags('News')
@ApiBearerAuth()
@Controller('news')
export class AppNewsController {
  constructor(private readonly news: NewsService) {}

  @Get()
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined, @Query() query: NewsListQueryDto) {
    const { items, hasMore } = await this.news.list(actor, query, RequestContext.locale());
    return pageOf(items.map(presentArticle), hasMore, query);
  }

  @Get(':id')
  @ApiOkResponse(OK)
  async detail(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentArticle(await this.news.get(actor, id, RequestContext.locale()));
  }

  @Get(':id/related')
  @ApiOkResponse(OK)
  async related(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return (await this.news.related(actor, id, RequestContext.locale())).map(presentArticle);
  }

  @Put(':id/save')
  @ApiOkResponse(OK)
  async save(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentArticle(await this.news.save(actor, id, RequestContext.locale()));
  }

  @Delete(':id/save')
  @ApiOkResponse(OK)
  async unsave(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentArticle(await this.news.unsave(actor, id, RequestContext.locale()));
  }

  @Put(':id/like')
  @ApiOkResponse(OK)
  async like(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentArticle(await this.news.like(actor, id, RequestContext.locale()));
  }

  @Delete(':id/like')
  @ApiOkResponse(OK)
  async unlike(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentArticle(await this.news.unlike(actor, id, RequestContext.locale()));
  }

  @Get(':id/comments')
  @ApiOkResponse(OK)
  async comments(
    @CurrentActor() actor: Actor | undefined,
    @Param('id') id: string,
    @Query() query: AppPaginationQueryDto,
  ) {
    const { items, hasMore } = await this.news.comments(actor, id, query);
    return pageOf(items.map(presentComment), hasMore, query);
  }

  @Post(':id/comments')
  @ApiBody({ schema: { type: 'object' } })
  @ApiCreatedResponse(OK)
  async comment(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentComment(await this.news.comment(actor, id, body));
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Deleted' })
  async deleteComment(
    @CurrentActor() actor: Actor | undefined,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ): Promise<void> {
    await this.news.deleteComment(actor, id, commentId);
  }
}
