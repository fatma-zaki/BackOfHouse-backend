import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Actor } from '../../../common/context/actor';
import { RequestContext } from '../../../common/context/request-context';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { AppPageMeta, Page } from '../../../common/pagination';
import { CompanyDirectoryService } from '../../../modules/companies';
import { ProfessionalsService, ProfilesService } from '../../../modules/profiles';
import { VerificationReviewService } from '../../../modules/verification';
import { IndividualsOnly } from '../account-context';
import { CompanyListQueryDto, ProfessionalListQueryDto } from './app-directory.dto';
import {
  presentCompany,
  presentExperience,
  presentProfessional,
  presentProfile,
  presentProfileProject,
  presentProject,
} from './app-presenters';

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };

const pageOf = <T>(items: T[], hasMore: boolean, query: { page: number; page_size: number }) =>
  new Page<T, AppPageMeta>(items, { page: query.page, page_size: query.page_size, has_more: hasMore });

/**
 * The individual's profile and Discover directories (contracts/app /me/profile,
 * /me/experience*, /me/projects*, /me/skills, /companies*, /professionals*). Individuals only; companies get 403 `FORBIDDEN`.
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
    private readonly verification: VerificationReviewService,
  ) {}

  /** `verified` comes from the verification decision only (verification-state.ts). */
  private async isVerified(userId: string): Promise<boolean> {
    return (await this.verification.verifiedUserIds([userId])).has(userId);
  }

  @Get('me/profile')
  @ApiOkResponse(OK)
  async profile(@CurrentActor() actor: Actor | undefined) {
    return presentProfile(
      await this.profiles.get(actor, RequestContext.locale()),
      await this.isVerified(actor!.kind === 'member' ? actor!.userId : ''),
    );
  }

  @Patch('me/profile')
  @ApiBody({ schema: { type: 'object' } })
  @ApiOkResponse(OK)
  async updateProfile(@CurrentActor() actor: Actor | undefined, @Body() body: unknown) {
    return presentProfile(
      await this.profiles.update(actor, body, RequestContext.locale()),
      await this.isVerified(actor!.kind === 'member' ? actor!.userId : ''),
    );
  }

  @Post('me/experience')
  @ApiBody({ schema: { type: 'object' } })
  @ApiCreatedResponse(OK)
  async createExperience(@CurrentActor() actor: Actor | undefined, @Body() body: unknown) {
    return presentExperience(await this.profiles.createExperience(actor, body));
  }

  @Patch('me/experience/:id')
  @ApiBody({ schema: { type: 'object' } })
  @ApiOkResponse(OK)
  async updateExperience(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentExperience(await this.profiles.updateExperience(actor, id, body));
  }

  @Delete('me/experience/:id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Deleted' })
  async deleteExperience(@CurrentActor() actor: Actor | undefined, @Param('id') id: string): Promise<void> {
    await this.profiles.deleteExperience(actor, id);
  }

  @Post('me/projects')
  @ApiBody({ schema: { type: 'object' } })
  @ApiCreatedResponse(OK)
  async createProject(@CurrentActor() actor: Actor | undefined, @Body() body: unknown) {
    return presentProfileProject(await this.profiles.createProject(actor, body));
  }

  @Patch('me/projects/:id')
  @ApiBody({ schema: { type: 'object' } })
  @ApiOkResponse(OK)
  async updateProject(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentProfileProject(await this.profiles.updateProject(actor, id, body));
  }

  @Delete('me/projects/:id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Deleted' })
  async deleteProject(@CurrentActor() actor: Actor | undefined, @Param('id') id: string): Promise<void> {
    await this.profiles.deleteProject(actor, id);
  }

  @Put('me/skills')
  @ApiBody({ schema: { type: 'object' } })
  @ApiOkResponse(OK)
  async setSkills(@CurrentActor() actor: Actor | undefined, @Body() body: unknown) {
    return presentProfile(
      await this.profiles.setSkills(actor, body, RequestContext.locale()),
      await this.isVerified(actor!.kind === 'member' ? actor!.userId : ''),
    );
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
    const verified = await this.verification.verifiedUserIds(items.map((p) => p.id));
    return pageOf(
      items.map((p) => presentProfessional(p, verified.has(p.id))),
      hasMore,
      query,
    );
  }

  /** Deprecated: connections are not offered (2026-11-10). */
  @Put('professionals/:id/connection')
  @ApiOperation({ deprecated: true })
  @ApiOkResponse(OK)
  async connect(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    const professional = await this.professionals.connect(actor, id);
    return presentProfessional(professional, await this.isVerified(professional.id));
  }

  /** Deprecated: connections are not offered (2026-11-10). */
  @Delete('professionals/:id/connection')
  @ApiOperation({ deprecated: true })
  @ApiOkResponse(OK)
  async disconnect(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    const professional = await this.professionals.disconnect(actor, id);
    return presentProfessional(professional, await this.isVerified(professional.id));
  }
}
