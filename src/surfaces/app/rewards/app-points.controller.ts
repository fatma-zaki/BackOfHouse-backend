import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AppPageMeta, AppPaginationQueryDto, Page } from '../../../common/pagination';
import { ACTIVITY_OF, PointEntryView, PointsService, PointsSummaryView } from '../../../modules/engagement';
import { IndividualsOnly } from '../account-context';

/** contracts/app GET /me/points/transactions query. */
export class PointsHistoryQueryDto extends AppPaginationQueryDto {
  @ApiPropertyOptional({ enum: ['ALL', 'EARNED', 'REDEEMED'], default: 'ALL' })
  @IsOptional()
  @IsIn(['ALL', 'EARNED', 'REDEEMED'])
  filter?: string;
}

/**
 * contracts/app `PointsSummary`. `next_benefit_at` is the next level's target until the
 * rewards catalog arrives (Phase 6C), when it becomes the cheapest reward above the balance.
 */
export function presentPointsSummary(s: PointsSummaryView, nextBenefitAt: number = s.levelTarget) {
  return {
    balance: s.balance,
    earned_this_month: s.earnedThisMonth,
    level: s.level,
    level_target: s.levelTarget,
    next_benefit_at: nextBenefitAt,
    total_earned: s.totalEarned,
    total_spent: s.totalSpent,
  };
}

/** contracts/app `PointsTransaction`. */
export function presentPointsTransaction(e: PointEntryView) {
  return {
    id: e.id,
    activity: ACTIVITY_OF[e.type],
    detail: e.title,
    date: e.createdAt.toISOString(),
    points: e.amount,
  };
}

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };

/** The member's points (contracts/app /me/points*). Individuals only. */
@ApiTags('Rewards')
@ApiBearerAuth()
@IndividualsOnly()
@Controller('me/points')
export class AppPointsController {
  constructor(private readonly points: PointsService) {}

  @Get()
  @ApiOkResponse(OK)
  async summary(@CurrentActor() actor: Actor | undefined) {
    return presentPointsSummary(await this.points.summary(actor));
  }

  @Get('transactions')
  @ApiOkResponse(OK)
  async history(@CurrentActor() actor: Actor | undefined, @Query() query: PointsHistoryQueryDto) {
    const { items, hasMore } = await this.points.history(actor, query);
    return new Page<ReturnType<typeof presentPointsTransaction>, AppPageMeta>(items.map(presentPointsTransaction), {
      page: query.page,
      page_size: query.page_size,
      has_more: hasMore,
    });
  }
}
