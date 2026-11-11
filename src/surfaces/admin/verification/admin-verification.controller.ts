import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOkResponse, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AdminPaginationQueryDto, adminPage } from '../../../common/pagination';
import { ReviewRequestView, VerificationReviewService } from '../../../modules/verification';
import { RequirePermission } from '../require-permission.decorator';

/** contracts/admin GET /verification-requests query. */
export class VerificationQueueQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'MORE_INFO', 'APPROVED', 'REJECTED'] })
  @IsOptional()
  @IsIn(['PENDING', 'MORE_INFO', 'APPROVED', 'REJECTED'])
  status?: string;

  @ApiPropertyOptional({ enum: ['USER', 'COMPANY'] })
  @IsOptional()
  @IsIn(['USER', 'COMPANY'])
  subject_type?: string;
}

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };
const OBJECT_BODY = { schema: { type: 'object' } };

/** contracts/admin `VerificationRequest`. Checks apply to opportunities only, so none here. */
export function presentReviewRequest(v: ReviewRequestView) {
  return {
    id: v.id,
    subject_type: v.subjectType,
    subject: v.subject,
    requested_by: {
      id: v.requestedBy.id,
      full_name: v.requestedBy.fullName,
      avatar_url: null,
      headline: null,
      city: null,
      verified: v.requestedBy.verified,
      is_student: v.requestedBy.isStudent,
    },
    documents: v.documents.map((d) => ({
      kind: d.kind,
      upload: { id: d.id, url: d.url, mime: d.mime, size: d.size, purpose: 'VERIFICATION_DOC' },
    })),
    checks: [] as unknown[],
    status: v.status,
    ...(v.dueAt ? { due_at: v.dueAt.toISOString() } : {}),
    decision_note: v.decisionNote,
    decided_by: v.decidedBy,
    created_at: v.createdAt.toISOString(),
  };
}

/** The verification review queue and decisions (contracts/admin /verification-requests*). */
@ApiTags('Admin verification')
@ApiCookieAuth('adminSession')
@Controller('verification-requests')
export class AdminVerificationController {
  constructor(private readonly review: VerificationReviewService) {}

  @Get()
  @RequirePermission('verification.view')
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined, @Query() query: VerificationQueueQueryDto) {
    const { items, total } = await this.review.list(actor, query);
    return adminPage(items.map(presentReviewRequest), query, total);
  }

  /** Document URLs expire after 5 minutes; each one issued is audited. */
  @Get(':id')
  @RequirePermission('verification.view')
  @ApiOkResponse(OK)
  async detail(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentReviewRequest(await this.review.detail(actor, id));
  }

  @Post(':id/approve')
  @HttpCode(200)
  @RequirePermission('verification.decide')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async approve(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentReviewRequest(await this.review.approve(actor, id, body));
  }

  @Post(':id/reject')
  @HttpCode(200)
  @RequirePermission('verification.decide')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async reject(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentReviewRequest(await this.review.reject(actor, id, body));
  }

  @Post(':id/request-info')
  @HttpCode(200)
  @RequirePermission('verification.decide')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async requestInfo(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentReviewRequest(await this.review.requestInfo(actor, id, body));
  }
}
