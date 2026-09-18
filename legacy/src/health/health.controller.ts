import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

/**
 * Liveness probe for container orchestrators. Deliberately unauthenticated and
 * free of dependencies, so it reports only that the process is serving HTTP and
 * reveals nothing about configuration or data.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @SkipThrottle()
  @ApiOkResponse({ description: 'The API process is running' })
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
