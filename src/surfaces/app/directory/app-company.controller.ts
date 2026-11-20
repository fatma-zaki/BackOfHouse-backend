import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { CompanyWorkspaceService, type CompanyView } from '../../../modules/companies';
import { OpportunitiesService } from '../../../modules/opportunities';
import { CompanyAccountOnly } from '../account-context';
import { presentCompany, presentProject, presentStats } from './app-presenters';

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };
const OBJECT_BODY = { schema: { type: 'object' } };

/**
 * The Company Account's workspace (contracts/app /company*). Individuals get 403
 * `FORBIDDEN`; a missing permission 403 `PERMISSION_DENIED`; another company's project 404.
 */
@ApiTags('Company')
@ApiBearerAuth()
@CompanyAccountOnly()
@Controller('company')
export class AppCompanyController {
  constructor(
    private readonly workspace: CompanyWorkspaceService,
    private readonly opportunities: OpportunitiesService,
  ) {}

  @Get()
  @ApiOkResponse(OK)
  async profile(@CurrentActor() actor: Actor | undefined) {
    return presentCompany(await this.withLiveCount(await this.workspace.profile(actor)));
  }

  @Patch()
  @CompanyAccountOnly('EDIT_PROFILE')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async updateProfile(@CurrentActor() actor: Actor | undefined, @Body() body: unknown) {
    return presentCompany(await this.withLiveCount(await this.workspace.updateProfile(actor, body)));
  }

  @Get('stats')
  @ApiOkResponse(OK)
  async stats(@CurrentActor() actor: Actor | undefined) {
    const stats = await this.workspace.stats(actor);
    const live = await this.opportunities.liveCounts([actor!.kind === 'company' ? actor!.companyId : '']);
    return presentStats({ ...stats, liveListings: [...live.values()][0] ?? 0 });
  }

  @Get('projects')
  @ApiOkResponse(OK)
  async projects(@CurrentActor() actor: Actor | undefined) {
    return (await this.workspace.projects(actor)).map(presentProject);
  }

  @Post('projects')
  @CompanyAccountOnly('MANAGE_PROJECTS')
  @ApiBody(OBJECT_BODY)
  @ApiCreatedResponse(OK)
  async createProject(@CurrentActor() actor: Actor | undefined, @Body() body: unknown) {
    return presentProject(await this.workspace.createProject(actor, body));
  }

  @Patch('projects/:id')
  @CompanyAccountOnly('MANAGE_PROJECTS')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async updateProject(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentProject(await this.workspace.updateProject(actor, id, body));
  }

  @Delete('projects/:id')
  @CompanyAccountOnly('MANAGE_PROJECTS')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Deleted' })
  async deleteProject(@CurrentActor() actor: Actor | undefined, @Param('id') id: string): Promise<void> {
    await this.workspace.deleteProject(actor, id);
  }

  /** contracts/app `Company.open_opportunities`: live listings, from the opportunities module. */
  private async withLiveCount(view: CompanyView): Promise<CompanyView> {
    const counts = await this.opportunities.liveCounts([view.id]);
    return { ...view, openOpportunities: counts.get(view.id) ?? 0 };
  }
}
