import { Controller, Get, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { SettingsService } from '../../../modules/settings';
import { AppPingDto, AppVersionDto, AppVersionQueryDto } from './app-meta.dto';

const dataOf = (model: new () => unknown) => ({
  schema: { type: 'object', required: ['data'], properties: { data: { $ref: getSchemaPath(model) } } },
});

/**
 * Surface check and forced-update policy (contracts/app: /ping, /meta/app-version).
 * The policy is a platform setting, editable by a Super admin; env vars are its defaults.
 */
@ApiTags('Meta')
@ApiExtraModels(AppPingDto, AppVersionDto)
@Public()
@Controller()
export class AppMetaController {
  constructor(private readonly settings: SettingsService) {}

  @Get('ping')
  @ApiOkResponse({ description: 'The app surface is mounted', ...dataOf(AppPingDto) })
  ping(): AppPingDto {
    return { status: 'OK', surface: 'app' };
  }

  @Get('meta/app-version')
  @ApiOkResponse({ description: 'Version policy for the platform', ...dataOf(AppVersionDto) })
  async appVersion(@Query() query: AppVersionQueryDto): Promise<AppVersionDto> {
    const { app_version } = await this.settings.current();
    const policy = query.platform === 'IOS' ? app_version.ios : app_version.android;
    return { platform: query.platform, ...policy };
  }
}
