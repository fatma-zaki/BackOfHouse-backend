import { Controller, Get, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { AppConfig } from '../../../config/app.config';
import { AppPingDto, AppVersionDto, AppVersionQueryDto } from './app-meta.dto';

const dataOf = (model: new () => unknown) => ({
  schema: { type: 'object', required: ['data'], properties: { data: { $ref: getSchemaPath(model) } } },
});

/** Surface check and forced-update policy (contracts/app: /ping, /meta/app-version). */
@ApiTags('Meta')
@ApiExtraModels(AppPingDto, AppVersionDto)
@Public()
@Controller()
export class AppMetaController {
  constructor(private readonly config: AppConfig) {}

  @Get('ping')
  @ApiOkResponse({ description: 'The app surface is mounted', ...dataOf(AppPingDto) })
  ping(): AppPingDto {
    return { status: 'OK', surface: 'app' };
  }

  @Get('meta/app-version')
  @ApiOkResponse({ description: 'Version policy for the platform', ...dataOf(AppVersionDto) })
  appVersion(@Query() query: AppVersionQueryDto): AppVersionDto {
    const policy = this.config.appVersion[query.platform];
    return {
      platform: query.platform,
      min_supported_version: policy.minSupportedVersion,
      latest_version: policy.latestVersion,
      update_url: policy.updateUrl,
    };
  }
}
