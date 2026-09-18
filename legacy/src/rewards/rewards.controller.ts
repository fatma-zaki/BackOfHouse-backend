import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { CreateRewardDto, UpdateRewardDto } from './dto/reward.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthContext } from '../auth/types/auth-context';
import { Permission } from '../auth/decorators/permissions.enum';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { PaginationQueryDto, paginate, parsePagination } from '../common/pagination/pagination.dto';
import { UUID } from '../common/types';

@ApiTags('Rewards')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post()
  @Auth(Permission.REWARD_MANAGE)
  @ApiOperation({ summary: 'Create a reward (platform administrators only)' })
  create(@Body() dto: CreateRewardDto, @CurrentUser() user: AuthContext) {
    return this.rewardsService.create(dto, user);
  }

  @Get()
  @Auth(Permission.REWARD_READ)
  @ApiOperation({ summary: 'List active rewards' })
  async findAll(@Query() query: PaginationQueryDto) {
    const pagination = parsePagination(query);
    const { data, total } = await this.rewardsService.findAll(query, pagination);
    return paginate(data, pagination.page, pagination.limit, total);
  }

  @Get('redemptions')
  @Auth(Permission.REWARD_REDEEM)
  @ApiOperation({ summary: 'Own redemptions' })
  async listOwnRedemptions(@CurrentUser() user: AuthContext, @Query() query: PaginationQueryDto) {
    const pagination = parsePagination(query);
    const { data, total } = await this.rewardsService.listOwnRedemptions(user, pagination);
    return paginate(data, pagination.page, pagination.limit, total);
  }

  @Patch('redemptions/:redemptionId/fulfil')
  @Auth(Permission.REWARD_FULFIL)
  @ApiOperation({ summary: 'Mark a pending redemption as fulfilled (platform administrators only)' })
  fulfilRedemption(
    @Param('redemptionId', ParseUuidPipe) redemptionId: UUID,
    @CurrentUser() user: AuthContext,
  ) {
    return this.rewardsService.fulfilRedemption(redemptionId, user);
  }

  @Patch('redemptions/:redemptionId/cancel')
  @Auth(Permission.REWARD_FULFIL)
  @ApiOperation({ summary: 'Cancel a pending redemption and refund its points (platform administrators only)' })
  cancelRedemption(
    @Param('redemptionId', ParseUuidPipe) redemptionId: UUID,
    @CurrentUser() user: AuthContext,
  ) {
    return this.rewardsService.cancelRedemption(redemptionId, user);
  }

  @Get(':id')
  @Auth(Permission.REWARD_READ)
  @ApiOperation({ summary: 'Get a reward by id' })
  findById(@Param('id', ParseUuidPipe) id: UUID) {
    return this.rewardsService.findById(id);
  }

  @Patch(':id')
  @Auth(Permission.REWARD_MANAGE)
  @ApiOperation({ summary: 'Update a reward (platform administrators only)' })
  update(
    @Param('id', ParseUuidPipe) id: UUID,
    @Body() dto: UpdateRewardDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.rewardsService.update(id, dto, user);
  }

  @Delete(':id')
  @Auth(Permission.REWARD_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a reward that has never been redeemed' })
  async remove(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext): Promise<void> {
    await this.rewardsService.remove(id, user);
  }

  @Post(':id/redeem')
  @Auth(Permission.REWARD_REDEEM)
  @ApiOperation({ summary: 'Redeem a reward with your own points' })
  @ApiResponse({ status: 201, description: 'Redemption recorded and points debited atomically' })
  @ApiResponse({ status: 400, description: 'Insufficient points, or the reward is unavailable' })
  @ApiResponse({ status: 409, description: 'Out of stock, or a redemption is already pending' })
  redeem(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext) {
    return this.rewardsService.redeem(id, user);
  }
}
