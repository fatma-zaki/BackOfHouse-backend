import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PointsService } from './points.service';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { PointsReferenceType, PointsTransactionType } from './points.types';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthContext } from '../auth/types/auth-context';
import { Permission } from '../auth/decorators/permissions.enum';
import { PaginationQueryDto, paginate, parsePagination } from '../common/pagination/pagination.dto';

@ApiTags('Points')
@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('balance')
  @Auth(Permission.POINTS_READ_OWN)
  @ApiOperation({ summary: 'Own points balance' })
  getBalance(@CurrentUser() user: AuthContext) {
    return this.pointsService.getBalance(user.profileId);
  }

  @Get('transactions')
  @Auth(Permission.POINTS_READ_OWN)
  @ApiOperation({ summary: 'Own points ledger' })
  async listTransactions(@CurrentUser() user: AuthContext, @Query() query: PaginationQueryDto) {
    const pagination = parsePagination(query);
    const { data, total } = await this.pointsService.listTransactions(user, pagination);
    return paginate(data, pagination.page, pagination.limit, total);
  }

  @Post('adjustments')
  @Auth(Permission.POINTS_ADJUST)
  @ApiOperation({ summary: 'Credit or debit a member (platform administrators only)' })
  adjust(@CurrentUser() user: AuthContext, @Body() dto: AdjustPointsDto) {
    return this.pointsService.award(
      {
        profileId: dto.user_id,
        amount: dto.amount,
        type: PointsTransactionType.AdminAdjustment,
        referenceType: PointsReferenceType.AdminAdjustment,
        referenceId: dto.user_id,
        description: dto.description,
      },
      user.profileId,
    );
  }
}
