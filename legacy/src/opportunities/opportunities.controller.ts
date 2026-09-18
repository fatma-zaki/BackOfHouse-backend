import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto, ListOpportunitiesQueryDto, UpdateOpportunityDto } from './dto/opportunity.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthContext } from '../auth/types/auth-context';
import { Permission } from '../auth/decorators/permissions.enum';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { paginate, parsePagination } from '../common/pagination/pagination.dto';
import { UUID } from '../common/types';

@ApiTags('Opportunities')
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Post()
  @Auth(Permission.OPPORTUNITY_CREATE)
  @ApiOperation({ summary: 'Publish a job, project or supplier request' })
  create(@CurrentUser() user: AuthContext, @Body() dto: CreateOpportunityDto) {
    return this.opportunitiesService.create(user, dto);
  }

  @Get()
  @Auth(Permission.OPPORTUNITY_READ)
  @ApiOperation({ summary: 'List opportunities, filtered by type, status or company' })
  async findAll(@Query() query: ListOpportunitiesQueryDto) {
    const pagination = parsePagination(query);
    const { data, total } = await this.opportunitiesService.findAll(query, pagination);
    return paginate(data, pagination.page, pagination.limit, total);
  }

  @Get(':id')
  @Auth(Permission.OPPORTUNITY_READ)
  @ApiOperation({ summary: 'Get an opportunity by id' })
  findById(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext) {
    return this.opportunitiesService.findById(id, user);
  }

  @Patch(':id')
  @Auth(Permission.OPPORTUNITY_READ)
  @ApiOperation({ summary: 'Update an opportunity (author or publishing company administrator)' })
  update(
    @Param('id', ParseUuidPipe) id: UUID,
    @Body() dto: UpdateOpportunityDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.opportunitiesService.update(id, dto, user);
  }

  @Delete(':id')
  @Auth(Permission.OPPORTUNITY_READ)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an opportunity (author or publishing company administrator)' })
  async remove(@Param('id', ParseUuidPipe) id: UUID, @CurrentUser() user: AuthContext): Promise<void> {
    await this.opportunitiesService.remove(id, user);
  }
}
