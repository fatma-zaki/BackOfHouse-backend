import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { ParseUuidPipe } from '../../../common/pipes/parse-uuid.pipe';
import { AdminMeView, AdminUserView, RolePermissionsView, TeamService } from '../../../modules/access';
import { RequirePermission } from '../require-permission.decorator';

const data = (description: string, items = false) => ({
  description,
  schema: {
    type: 'object',
    required: ['data'],
    properties: { data: items ? { type: 'array', items: { type: 'object' } } : { type: 'object' } },
  },
});

/** The signed-in staff member and the team (contracts/admin: /me, /roles, /team, /team/invites). */
@ApiTags('Admin team')
@ApiCookieAuth('adminSession')
@Controller()
export class AdminTeamController {
  constructor(private readonly team: TeamService) {}

  /** Any signed-in staff member: their permissions build the menu, the API still checks every route. */
  @Get('me')
  @ApiOkResponse(data('The signed-in staff member, permissions and home screen'))
  me(@CurrentActor() actor: Actor): Promise<AdminMeView> {
    return this.team.me(actor);
  }

  @Get('roles')
  @RequirePermission('team.view')
  @ApiOkResponse(data('Role → permission matrix', true))
  roles(@CurrentActor() actor: Actor): RolePermissionsView[] {
    return this.team.roles(actor);
  }

  @Get('team')
  @RequirePermission('team.view')
  @ApiOkResponse(data('Staff accounts', true))
  list(@CurrentActor() actor: Actor): Promise<AdminUserView[]> {
    return this.team.list(actor);
  }

  @Post('team/invites')
  @RequirePermission('team.manage')
  @ApiBody({ schema: { type: 'object', description: 'InviteRequest (contracts/admin/openapi.yaml)' } })
  @ApiCreatedResponse(data('Invited (status INVITED)'))
  invite(@CurrentActor() actor: Actor, @Body() body: unknown): Promise<AdminUserView> {
    return this.team.invite(actor, body);
  }

  @Delete('team/invites/:id')
  @HttpCode(204)
  @RequirePermission('team.manage')
  @ApiNoContentResponse({ description: 'Invitation cancelled' })
  async cancelInvite(@CurrentActor() actor: Actor, @Param('id', ParseUuidPipe) id: string): Promise<void> {
    await this.team.cancelInvite(actor, id);
  }

  @Patch('team/:id')
  @RequirePermission('team.manage')
  @ApiBody({ schema: { type: 'object', properties: { role: { type: 'string' }, status: { type: 'string' } } } })
  @ApiOkResponse(data('Updated staff account'))
  update(
    @CurrentActor() actor: Actor,
    @Param('id', ParseUuidPipe) id: string,
    @Body() body: unknown,
  ): Promise<AdminUserView> {
    return this.team.update(actor, id, body);
  }
}
