import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { DomainError, ErrorCode } from '../../common/errors';
import { PrismaService } from '../database/prisma.service';

/**
 * Liveness and readiness probes (backend-development-order.md Stage 1).
 * Neither response reveals versions, configuration or error details.
 */
@ApiTags('Health')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'The process is serving HTTP' })
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOkResponse({ description: 'The database is reachable' })
  @ApiServiceUnavailableResponse({ description: 'A dependency is unavailable' })
  async ready(): Promise<{ status: 'ok' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new DomainError(ErrorCode.SERVICE_UNAVAILABLE, 'Not ready', HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { status: 'ok' };
  }
}
