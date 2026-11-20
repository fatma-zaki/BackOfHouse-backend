import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AdminPaginationQueryDto, adminPage } from '../../../common/pagination';
import { ArticleChecksService } from '../../../modules/backoffice';
import { ArticleAdminView, ArticlesService, ArticleTranslationView } from '../../../modules/content';
import { RequirePermission } from '../require-permission.decorator';

/** contracts/admin GET /articles query (validated again in the service). */
export class ArticlesQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ enum: ['PUBLISHED', 'SCHEDULED', 'DRAFT'] })
  @IsOptional()
  @IsIn(['PUBLISHED', 'SCHEDULED', 'DRAFT'])
  status?: string;
}

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };
const OBJECT_BODY = { schema: { type: 'object' } };

const presentTranslation = (t: ArticleTranslationView | null) =>
  t ? { headline: t.headline, excerpt: t.excerpt ?? '', body: t.body, cta_label: t.ctaLabel } : null;

/** contracts/admin `ArticleAdmin`. `category` is the news topic code. */
function presentArticle(a: ArticleAdminView) {
  return {
    id: a.id,
    slug: a.slug,
    ...(a.topic ? { category: a.topic } : {}),
    cover_url: a.coverUrl,
    cover_alt: a.coverAlt,
    en: presentTranslation(a.en),
    ar: presentTranslation(a.ar),
    link: a.link,
    source: a.source,
    labels: a.labels,
    interests: a.interests,
    status: a.status,
    scheduled_at: a.scheduledAt?.toISOString() ?? null,
    published_at: a.publishedAt?.toISOString() ?? null,
    author: a.author,
    reads: a.reads,
    updated_at: a.updatedAt.toISOString(),
  };
}

/** The editorial desk (contracts/admin /articles*). */
@ApiTags('Admin news')
@ApiCookieAuth('adminSession')
@Controller('articles')
export class AdminArticlesController {
  constructor(
    private readonly articles: ArticlesService,
    private readonly checks: ArticleChecksService,
  ) {}

  @Get()
  @RequirePermission('news.view')
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined, @Query() query: ArticlesQueryDto) {
    const { items, total } = await this.articles.list(actor, query);
    return adminPage(items.map(presentArticle), query, total);
  }

  @Post()
  @RequirePermission('news.manage')
  @ApiBody(OBJECT_BODY)
  @ApiCreatedResponse(OK)
  async create(@CurrentActor() actor: Actor | undefined, @Body() body: unknown) {
    return presentArticle(await this.articles.create(actor, body));
  }

  @Get(':id')
  @RequirePermission('news.view')
  @ApiOkResponse(OK)
  async detail(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentArticle(await this.articles.get(actor, id));
  }

  /** Autosave. A scheduled or live article must keep both languages (422 TRANSLATION_MISSING). */
  @Patch(':id')
  @RequirePermission('news.manage')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async update(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentArticle(await this.articles.update(actor, id, body));
  }

  @Get(':id/checks')
  @RequirePermission('news.manage')
  @ApiOkResponse(OK)
  async prePublishChecks(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return this.checks.checks(actor, id);
  }

  /** Publish now (`publish_at` null) or at a time; 422 TRANSLATION_MISSING without both languages. */
  @Post(':id/schedule')
  @HttpCode(200)
  @RequirePermission('news.manage')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async schedule(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentArticle(await this.articles.schedule(actor, id, body));
  }

  @Post(':id/unpublish')
  @HttpCode(200)
  @RequirePermission('news.manage')
  @ApiOkResponse(OK)
  async unpublish(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentArticle(await this.articles.unpublish(actor, id));
  }

  @Post(':id/unschedule')
  @HttpCode(200)
  @RequirePermission('news.manage')
  @ApiOkResponse(OK)
  async unschedule(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentArticle(await this.articles.unschedule(actor, id));
  }
}
