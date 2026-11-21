import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AppPageMeta, AppPaginationQueryDto, Page } from '../../../common/pagination';
import { OPPORTUNITY_TYPES, OpportunitiesService } from '../../../modules/opportunities';
import { CompanyAccountOnly, IndividualsOnly } from '../account-context';
import { presentOpportunity } from './app-opportunity.presenters';

/** contracts/app GET /opportunities query. */
export class OpportunityListQueryDto extends AppPaginationQueryDto {
  @ApiPropertyOptional({ enum: OPPORTUNITY_TYPES })
  @IsOptional()
  @IsIn(OPPORTUNITY_TYPES)
  type?: string;

  @ApiPropertyOptional({ description: 'Free-text search, case-insensitive' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };
const OBJECT_BODY = { schema: { type: 'object' } };

/** Live listings (contracts/app /opportunities*, /companies/{id}/opportunities). Individuals only. */
@ApiTags('Discover')
@ApiBearerAuth()
@IndividualsOnly()
@Controller()
export class AppOpportunitiesController {
  constructor(private readonly opportunities: OpportunitiesService) {}

  @Get('opportunities')
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined, @Query() query: OpportunityListQueryDto) {
    const { items, hasMore } = await this.opportunities.list(actor, query);
    return new Page<ReturnType<typeof presentOpportunity>, AppPageMeta>(items.map(presentOpportunity), {
      page: query.page,
      page_size: query.page_size,
      has_more: hasMore,
    });
  }

  @Get('opportunities/:id')
  @ApiOkResponse(OK)
  async detail(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentOpportunity(await this.opportunities.get(actor, id));
  }

  @Get('companies/:id/opportunities')
  @ApiOkResponse(OK)
  async ofCompany(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return (await this.opportunities.ofCompany(actor, id)).map(presentOpportunity);
  }
}

/**
 * The Company Account's listings (contracts/app /company/opportunities*). Writes need
 * `MANAGE_OPPORTUNITIES`; another company's listing is 404.
 */
@ApiTags('Company')
@ApiBearerAuth()
@CompanyAccountOnly()
@Controller('company/opportunities')
export class AppCompanyOpportunitiesController {
  constructor(private readonly opportunities: OpportunitiesService) {}

  @Get()
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined) {
    return (await this.opportunities.listOwn(actor)).map(presentOpportunity);
  }

  @Post()
  @CompanyAccountOnly('MANAGE_OPPORTUNITIES')
  @ApiBody(OBJECT_BODY)
  @ApiCreatedResponse(OK)
  async create(@CurrentActor() actor: Actor | undefined, @Body() body: unknown) {
    return presentOpportunity(await this.opportunities.create(actor, body));
  }

  @Get(':id')
  @ApiOkResponse(OK)
  async detail(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentOpportunity(await this.opportunities.getOwn(actor, id));
  }

  @Patch(':id')
  @CompanyAccountOnly('MANAGE_OPPORTUNITIES')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async update(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentOpportunity(await this.opportunities.update(actor, id, body));
  }

  @Post(':id/submit')
  @HttpCode(200)
  @CompanyAccountOnly('MANAGE_OPPORTUNITIES')
  @ApiOkResponse(OK)
  async submit(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentOpportunity(await this.opportunities.submit(actor, id));
  }

  @Post(':id/return-to-draft')
  @HttpCode(200)
  @CompanyAccountOnly('MANAGE_OPPORTUNITIES')
  @ApiOkResponse(OK)
  async returnToDraft(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentOpportunity(await this.opportunities.returnToDraft(actor, id));
  }

  @Post(':id/close')
  @HttpCode(200)
  @CompanyAccountOnly('MANAGE_OPPORTUNITIES')
  @ApiOkResponse(OK)
  async close(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentOpportunity(await this.opportunities.close(actor, id));
  }

  @Post(':id/revision')
  @CompanyAccountOnly('MANAGE_OPPORTUNITIES')
  @ApiCreatedResponse(OK)
  async startRevision(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentOpportunity(await this.opportunities.startRevision(actor, id));
  }

  @Patch(':id/revision')
  @CompanyAccountOnly('MANAGE_OPPORTUNITIES')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async updateRevision(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentOpportunity(await this.opportunities.updateRevision(actor, id, body));
  }

  @Post(':id/revision/submit')
  @HttpCode(200)
  @CompanyAccountOnly('MANAGE_OPPORTUNITIES')
  @ApiOkResponse(OK)
  async submitRevision(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentOpportunity(await this.opportunities.submitRevision(actor, id));
  }
}
