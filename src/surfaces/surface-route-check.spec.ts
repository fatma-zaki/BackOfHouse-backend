import { Controller, Get, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { APP_SURFACE_PATH, GLOBAL_PREFIX } from './surface-paths';
import { isAllowedRoute, SurfaceRouteCheck } from './surface-route-check';

@Controller('things')
class ThingsController {
  @Get()
  list(): string[] {
    return [];
  }
}

/** Binds middleware on every route, like the request-context and logger middleware do. */
@Module({ controllers: [ThingsController] })
class FakeAppFeatureModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply((_req: unknown, _res: unknown, next: () => void) => next()).forRoutes('*');
  }
}

/** Global middleware outside any surface, like LoggerModule's (Express 5 registers `/api/{*path}`). */
@Module({})
class GlobalMiddlewareModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply((_req: unknown, _res: unknown, next: () => void) => next()).forRoutes('*');
  }
}

@Controller('stray')
class StrayController {
  @Get()
  get(): string {
    return 'not on any surface';
  }
}

@Module({ controllers: [StrayController] })
class StrayModule {}

async function boot(imports: unknown[]): Promise<void> {
  const moduleRef = await Test.createTestingModule({
    imports: imports as never[],
    providers: [SurfaceRouteCheck],
  }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  app.setGlobalPrefix(GLOBAL_PREFIX);
  try {
    await app.init();
  } finally {
    await app.close();
  }
}

describe('SurfaceRouteCheck (execution-plan.md §1.5)', () => {
  const surfaceFeature = [
    FakeAppFeatureModule,
    RouterModule.register([{ path: APP_SURFACE_PATH, module: FakeAppFeatureModule }]),
  ];

  it('boots when every route sits under a surface, ignoring forRoutes("*") middleware', async () => {
    await expect(boot(surfaceFeature)).resolves.toBeUndefined();
  });

  it('ignores global forRoutes("*") middleware outside the surfaces', async () => {
    await expect(boot([...surfaceFeature, GlobalMiddlewareModule])).resolves.toBeUndefined();
  });

  it('fails boot when a controller is mounted outside the surfaces', async () => {
    await expect(boot([...surfaceFeature, StrayModule])).rejects.toThrow(
      'Routes outside the app and admin surfaces (ADR-031): GET /api/stray',
    );
  });

  it.each([
    ['/api/app/v1/ping', true],
    ['/api/admin/v1/users/:id', true],
    ['/api/health', true],
    ['/api/health/ready', true],
    ['/docs/app', true],
    ['/docs/admin-json', true],
    ['/api/v1/ping', false],
    ['/api/apps/v1/ping', false],
    ['/api/admin/v2/ping', false],
    ['/stray', false],
  ])('classifies %s as allowed = %s', (path, allowed) => {
    expect(isAllowedRoute(path)).toBe(allowed);
  });
});
