import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NewsService } from './news.service';
import {
  CreateCommentDto,
  CreateNewsArticleDto,
  ModerateCommentDto,
  UpdateNewsArticleDto,
  UpsertReactionDto,
} from './dto/news.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthContext } from '../auth/types/auth-context';
import { Permission } from '../auth/decorators/permissions.enum';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { PaginationQueryDto, paginate, parsePagination } from '../common/pagination/pagination.dto';
import { UUID } from '../common/types';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @Auth(Permission.NEWS_PUBLISH)
  @ApiOperation({ summary: 'Create an article (platform editors only)' })
  createArticle(@CurrentUser() user: AuthContext, @Body() dto: CreateNewsArticleDto) {
    return this.newsService.createArticle(user, dto);
  }

  @Get()
  @Auth(Permission.NEWS_READ)
  @ApiOperation({ summary: 'List published articles' })
  async findAll(@Query() query: PaginationQueryDto) {
    const pagination = parsePagination(query);
    const { data, total } = await this.newsService.findAll(query, pagination);
    return paginate(data, pagination.page, pagination.limit, total);
  }

  // Comment routes are declared before the ':id' routes so that a literal
  // path segment is never captured as an article id.
  @Delete('comments/:commentId')
  @Auth(Permission.NEWS_COMMENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete your own comment (moderators may delete any)' })
  async removeComment(
    @Param('commentId', ParseUuidPipe) commentId: UUID,
    @CurrentUser() user: AuthContext,
  ): Promise<void> {
    await this.newsService.removeComment(commentId, user);
  }

  @Patch('comments/:commentId/moderation')
  @Auth(Permission.NEWS_MODERATE)
  @ApiOperation({ summary: 'Hide or flag a comment (moderators only)' })
  moderateComment(
    @Param('commentId', ParseUuidPipe) commentId: UUID,
    @Body() dto: ModerateCommentDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.newsService.moderateComment(commentId, dto, user);
  }

  @Get(':id')
  @Auth(Permission.NEWS_READ)
  @ApiOperation({ summary: 'Get an article by id' })
  findById(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext) {
    return this.newsService.findById(id, user);
  }

  @Patch(':id')
  @Auth(Permission.NEWS_PUBLISH)
  @ApiOperation({ summary: 'Update or publish an article (platform editors only)' })
  updateArticle(
    @Param('id', ParseUuidPipe) id: UUID,
    @Body() dto: UpdateNewsArticleDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.newsService.updateArticle(id, dto, user);
  }

  @Delete(':id')
  @Auth(Permission.NEWS_PUBLISH)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an article (platform editors only)' })
  async removeArticle(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext): Promise<void> {
    await this.newsService.removeArticle(id, user);
  }

  @Post(':id/comments')
  @Auth(Permission.NEWS_COMMENT)
  @ApiOperation({ summary: 'Comment on a published article' })
  addComment(
    @Param('id', ParseUuidPipe) id: UUID,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.newsService.addComment(id, user, dto);
  }

  @Get(':id/comments')
  @Auth(Permission.NEWS_READ)
  @ApiOperation({ summary: 'List visible comments on an article' })
  async listComments(
    @Param('id', ParseUuidPipe) id: UUID,
    @CurrentUser() user: AuthContext,
    @Query() query: PaginationQueryDto,
  ) {
    const pagination = parsePagination(query);
    const { data, total } = await this.newsService.listComments(id, user, pagination);
    return paginate(data, pagination.page, pagination.limit, total);
  }

  @Put(':id/reactions/me')
  @Auth(Permission.NEWS_REACT)
  @ApiOperation({ summary: 'Set your reaction to an article' })
  upsertReaction(
    @Param('id', ParseUuidPipe) id: UUID,
    @Body() dto: UpsertReactionDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.newsService.upsertReaction(id, user, dto);
  }

  @Delete(':id/reactions/me')
  @Auth(Permission.NEWS_REACT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove your reaction from an article' })
  async removeReaction(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext): Promise<void> {
    await this.newsService.removeReaction(id, user);
  }
}
