import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AdminPaginationQueryDto, OffsetPageMeta, Page } from '../../../common/pagination';
import {
  OpportunityReviewService,
  SupplierResponsesService,
  SupplierResponseStatus,
  SupplierResponseView,
} from '../../../modules/opportunities';
import { RequirePermission } from '../require-permission.decorator';
import { presentAdminCompanySummary, presentOpportunityAdmin } from './admin-opportunities.controller';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** contracts/admin GET /supplier-requests query (validated again in the service). */
export class SupplierRequestsQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @Matches(DATE)
  from?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @Matches(DATE)
  to?: string;

  @ApiPropertyOptional({ enum: ['OPEN', 'AWARDED', 'CLOSED'] })
  @IsOptional()
  @IsIn(['OPEN', 'AWARDED', 'CLOSED'])
  status?: string;

  @ApiPropertyOptional({ description: 'A company type the request invites' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}

/** contracts/admin `SupplierResponse.status` names the stages differently from the app. */
const ADMIN_RESPONSE_STATUS: Record<SupplierResponseStatus, string> = {
  SUBMITTED: 'NEW',
  REVIEWED: 'NEW',
  SHORTLISTED: 'SHORTLISTED',
  SELECTED: 'AWARDED',
  REJECTED: 'DECLINED',
};

/**
 * contracts/admin `SupplierResponse`. No price: it is shown only to the buyer and the
 * responder. `stage` is the app status (REVIEWED reads as NEW in `status`).
 */
function presentSupplierResponseAdmin(v: SupplierResponseView & { repliedInHours: number | null }) {
  return {
    id: v.id,
    supplier: presentAdminCompanySummary(v.responder),
    setup_time: v.setupTime,
    message: v.message,
    projects: v.projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      event_name: null,
      year: Number(p.startedAt.slice(0, 4)),
    })),
    status: ADMIN_RESPONSE_STATUS[v.status],
    stage: v.status,
    replied_in_hours: v.repliedInHours,
    created_at: v.createdAt.toISOString(),
  };
}

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {}, meta: {} } } };

/** Supplier requests in the back office, read-only (contracts/admin /supplier-requests*). */
@ApiTags('Admin supplier requests')
@ApiCookieAuth('adminSession')
@Controller('supplier-requests')
export class AdminSupplierRequestsController {
  constructor(
    private readonly reviews: OpportunityReviewService,
    private readonly responses: SupplierResponsesService,
  ) {}

  @Get()
  @RequirePermission('suppliers.view')
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined, @Query() query: SupplierRequestsQueryDto) {
    const { items, total, kpis } = await this.reviews.supplierRequests(actor, query);
    return new Page<ReturnType<typeof presentOpportunityAdmin>, OffsetPageMeta>(
      items.map(presentOpportunityAdmin),
      {
        page: query.page,
        page_size: query.page_size,
        total,
        total_pages: Math.max(1, Math.ceil(total / query.page_size)),
      },
      { kpis },
    );
  }

  @Get(':id/responses')
  @RequirePermission('suppliers.view')
  @ApiOkResponse(OK)
  async responsesOf(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return (await this.responses.forRequestAdmin(actor, id)).map(presentSupplierResponseAdmin);
  }
}
