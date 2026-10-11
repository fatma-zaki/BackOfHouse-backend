import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { AdminSurfaceModule } from './admin/admin-surface.module';
import { AppSurfaceModule } from './app/app-surface.module';
import { Surface } from './surface-paths';

const ERRORS = 'Errors: { code, message, trace_id, errors } (docs/error-codes.md). Validation failures: 422.';

/**
 * One OpenAPI document per surface, generated from the code (ADR-031). CI compares
 * them with contracts/<surface>/openapi.yaml (scripts/contracts/check.mjs).
 */
export function buildSurfaceDocuments(app: INestApplication): Record<Surface, OpenAPIObject> {
  return {
    app: SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Back Of House — App API')
        .setDescription(`Flutter app (members and Company Accounts). Contract: contracts/app/openapi.yaml. ${ERRORS}`)
        .setVersion('1.0.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
        .build(),
      { include: [AppSurfaceModule] },
    ),
    admin: SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Back of House — Admin API')
        .setDescription(`Admin back-office. Contract: contracts/admin/openapi.yaml. ${ERRORS}`)
        .setVersion('1.0.0')
        .addCookieAuth('__Host-boh_admin', { type: 'apiKey', in: 'cookie', name: '__Host-boh_admin' }, 'adminSession')
        .build(),
      { include: [AdminSurfaceModule] },
    ),
  };
}
