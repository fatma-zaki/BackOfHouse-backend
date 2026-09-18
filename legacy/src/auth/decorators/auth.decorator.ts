import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from './permissions.decorator';
import { Permission } from './permissions.enum';
import { BEARER_AUTH_NAME } from '../../common/constants';

/**
 * Requires a verified Supabase session, plus the listed permissions.
 *
 * Called with no permissions it only requires authentication — resource-level
 * authorization (company membership, record ownership) is then enforced by the
 * service that owns the resource.
 */
export const Auth = (...permissions: Permission[]): MethodDecorator & ClassDecorator =>
  applyDecorators(
    UseGuards(AuthGuard, PermissionsGuard),
    RequirePermissions(...permissions),
    ApiBearerAuth(BEARER_AUTH_NAME),
    ApiUnauthorizedResponse({ description: 'Missing, malformed or expired access token' }),
    ApiForbiddenResponse({ description: 'Authenticated but not allowed to perform this action' }),
  );
