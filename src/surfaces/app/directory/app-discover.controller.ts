import { Body, Controller, Delete, Get, Param, Patch, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Actor } from '../../../common/context/actor';
import { RequestContext } from '../../../common/context/request-context';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AppPageMeta, Page } from '../../../common/pagination';
import { CompanyDirectoryService } from '../../../modules/companies';
import { ProfessionalsService, ProfilesService } from '../../../modules/profiles';
import { IndividualsOnly } from '../account-context';
import { CompanyListQueryDto, ProfessionalListQueryDto } from './app-directory.dto';
import { presentCompany, presentProfessional, presentProfile, presentProject } from './app-presenters';

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };

const pageOf = <T>(items: T[], hasMore: boolean, query: { page: number; page_size: number }) =>
  new Page<T, AppPageMeta>(items, { page: query.page, page_size: query.page_size, has_more: hasMore });

/**
 * The individual's profile and Discover directories (contracts/app /me/profile,
 * /companies*, /professionals*). Individuals only; companies get 403 `FORBIDDEN`.
 */
@ApiTags('Discover')
@ApiBearerAuth()
@IndividualsOnly()
@Controller()
export class AppDiscoverController {
  constructor(
    private readonly profiles: ProfilesService,
    private readonly professionals: ProfessionalsService,
    private readonly companies: CompanyDirectoryService,
  ) {}

  @Get('me/profile')
  @ApiOkResponse(OK)
  async profile(@CurrentActor() actor: Actor | undefined) {
    return presentProfile(await this.profiles.get(actor));
  }

  @Patch('me/profile')
  @ApiBody({ schema: { type: 'object' } })
  @ApiOkResponse(OK)
  async updateProfile(@CurrentActor() actor: Actor | undefined, @Body() body: unknown) {
    return presentProfile(await this.profiles.update(actor, body));
  }

  @Get('companies')
  @ApiOkResponse(OK)
  async listCompanies(@CurrentActor() actor: Actor | undefined, @Query() query: CompanyListQueryDto) {
    const { items, hasMore } = await this.companies.list(actor, query, RequestContext.locale());
    return pageOf(items.map(presentCompany), hasMore, query);
  }

  @Get('companies/:id')
  @ApiOkResponse(OK)
  async company(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentCompany(await this.companies.get(actor, id));
  }

  @Put('companies/:id/follow')
  @ApiOkResponse(OK)
  async follow(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentCompany(await this.companies.follow(actor, id));
  }

  @Delete('companies/:id/follow')
  @ApiOkResponse(OK)
  async unfollow(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentCompany(await this.companies.unfollow(actor, id));
  }

  @Get('companies/:id/projects')
  @ApiOkResponse(OK)
  async companyProjects(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return (await this.companies.projects(actor, id)).map(presentProject);
  }

  @Get('professionals')
  @ApiOkResponse(OK)
  async listProfessionals(@CurrentActor() actor: Actor | undefined, @Query() query: ProfessionalListQueryDto) {
    const { items, hasMore } = await this.professionals.list(actor, query, RequestContext.locale());
    return pageOf(items.map(presentProfessional), hasMore, query);
  }

  @Put('professionals/:id/connection')
  @ApiOkResponse(OK)
  async connect(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentProfessional(await this.professionals.connect(actor, id));
  }

  @Delete('professionals/:id/connection')
  @ApiOkResponse(OK)
  async disconnect(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentProfessional(await this.professionals.disconnect(actor, id));
  }
}
