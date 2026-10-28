import { Controller, Get } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiProperty, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';

export class AdminPingDto {
  @ApiProperty({ enum: ['OK'] })
  status!: 'OK';

  @ApiProperty({ enum: ['admin'] })
  surface!: 'admin';
}

/** Surface check (contracts/admin: /ping). */
@ApiTags('Admin meta')
@ApiExtraModels(AdminPingDto)
@Public()
@Controller()
export class AdminMetaController {
  @Get('ping')
  @ApiOkResponse({
    description: 'The admin surface is mounted',
    schema: { type: 'object', required: ['data'], properties: { data: { $ref: getSchemaPath(AdminPingDto) } } },
  })
  ping(): AdminPingDto {
    return { status: 'OK', surface: 'admin' };
  }
}
