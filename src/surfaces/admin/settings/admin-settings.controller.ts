import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { PlatformSettings, SettingsService } from '../../../modules/settings';
import { RequirePermission } from '../require-permission.decorator';

const SETTINGS_SCHEMA = { type: 'object', description: 'PlatformSettings (contracts/admin/openapi.yaml)' };
const SETTINGS_RESPONSE = {
  description: 'OK',
  schema: { type: 'object', required: ['data'], properties: { data: SETTINGS_SCHEMA } },
};

/** Platform settings (contracts/admin: GET/PUT /settings, phase 1). Super admin only. */
@ApiTags('Admin settings')
@ApiCookieAuth('adminSession')
@Controller('settings')
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @RequirePermission('settings.view')
  @ApiOkResponse(SETTINGS_RESPONSE)
  get(@CurrentActor() actor: Actor | undefined): Promise<PlatformSettings> {
    return this.settings.getForStaff(actor);
  }

  /** Validated by the settings schema in the service (422 with field errors). */
  @Put()
  @RequirePermission('settings.manage')
  @ApiBody({ schema: SETTINGS_SCHEMA })
  @ApiOkResponse(SETTINGS_RESPONSE)
  update(@CurrentActor() actor: Actor | undefined, @Body() body: unknown): Promise<PlatformSettings> {
    return this.settings.update(actor, body);
  }
}
