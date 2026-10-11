import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const APP_PLATFORMS = ['IOS', 'ANDROID'] as const;
export type AppPlatform = (typeof APP_PLATFORMS)[number];

export class AppPingDto {
  @ApiProperty({ enum: ['OK'] })
  status!: 'OK';

  @ApiProperty({ enum: ['app'] })
  surface!: 'app';
}

export class AppVersionQueryDto {
  @ApiProperty({ enum: APP_PLATFORMS })
  @IsIn(APP_PLATFORMS)
  platform!: AppPlatform;
}

export class AppVersionDto {
  @ApiProperty({ enum: APP_PLATFORMS })
  platform!: AppPlatform;

  @ApiProperty({ example: '1.0.0' })
  min_supported_version!: string;

  @ApiProperty({ example: '1.2.0' })
  latest_version!: string;

  @ApiProperty({ format: 'uri' })
  update_url!: string;
}
