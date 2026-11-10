import { Body, Controller, Get, HttpCode, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Actor } from '../../../common/context/actor';
import { RequestContext } from '../../../common/context/request-context';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AppPageMeta, AppPaginationQueryDto, Page } from '../../../common/pagination';
import { MemberFeedService, MemberNotificationView, NOTIFICATION_SOURCE } from '../../../modules/notifications';
import {
  MAX_DOCUMENT_BYTES,
  UploadedDocument,
  VerificationRequestView,
  VerificationService,
} from '../../../modules/verification';
import { IndividualsOnly } from '../account-context';
import { FileTooLargeInterceptor } from './file-too-large.interceptor';

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };

/** contracts/app `VerificationRequest`. */
function presentVerification(v: VerificationRequestView) {
  return { status: v.status, files: v.files, submitted_at: v.submittedAt?.toISOString() ?? null };
}

/** contracts/app `Notification`. Application updates arrive with Phase 5, points with Phase 6. */
function presentNotification(n: MemberNotificationView) {
  return {
    id: n.id,
    category: n.category,
    title: n.title,
    body: n.body,
    created_at: n.createdAt.toISOString(),
    target_type: n.targetType,
    target_id: n.targetId,
    source: NOTIFICATION_SOURCE,
    points_delta: null,
    read: n.read,
    application_update: null,
  };
}

/**
 * The individual's verification request and notifications (contracts/app
 * /me/verification*, /me/notifications*). Individuals only.
 */
@ApiTags('Me')
@ApiBearerAuth()
@IndividualsOnly()
@Controller('me')
export class AppMeController {
  constructor(
    private readonly verification: VerificationService,
    private readonly feed: MemberFeedService,
  ) {}

  @Get('verification')
  @ApiOkResponse(OK)
  async getVerification(@CurrentActor() actor: Actor | undefined) {
    return presentVerification(await this.verification.get(actor));
  }

  /** Multipart: `document` (IDENTITY or EXPERIENCE) and `file` (PDF, JPEG or PNG, ≤ 10 MB). */
  @Post('verification/documents')
  @HttpCode(200)
  @UseInterceptors(
    FileTooLargeInterceptor,
    FileInterceptor('file', { limits: { fileSize: MAX_DOCUMENT_BYTES, files: 1, fields: 5 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['document', 'file'],
      properties: { document: { type: 'string' }, file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse(OK)
  async uploadDocument(
    @CurrentActor() actor: Actor | undefined,
    @Body() body: { document?: unknown } | undefined,
    @UploadedFile() file: UploadedDocument | undefined,
  ) {
    return presentVerification(await this.verification.uploadDocument(actor, body?.document, file));
  }

  @Post('verification/submit')
  @HttpCode(200)
  @ApiOkResponse(OK)
  async submitVerification(@CurrentActor() actor: Actor | undefined) {
    return presentVerification(await this.verification.submit(actor));
  }

  @Get('notifications')
  @ApiOkResponse(OK)
  async notifications(@CurrentActor() actor: Actor | undefined, @Query() query: AppPaginationQueryDto) {
    const { items, hasMore } = await this.feed.list(actor, query, RequestContext.locale());
    return new Page<ReturnType<typeof presentNotification>, AppPageMeta>(items.map(presentNotification), {
      page: query.page,
      page_size: query.page_size,
      has_more: hasMore,
    });
  }

  @Post('notifications/:id/read')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Done' })
  async markRead(@CurrentActor() actor: Actor | undefined, @Param('id') id: string): Promise<void> {
    await this.feed.markRead(actor, id);
  }

  @Post('notifications/read-all')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Done' })
  async markAllRead(@CurrentActor() actor: Actor | undefined): Promise<void> {
    await this.feed.markAllRead(actor);
  }
}
