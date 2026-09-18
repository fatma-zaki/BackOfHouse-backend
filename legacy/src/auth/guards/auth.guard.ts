import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AuthContext, AuthenticatedRequest } from '../types/auth-context';
import { Role, parseRole } from '../decorators/permissions.enum';
import { ForbiddenException, UnauthorizedException } from '../../common/exceptions/business.exceptions';
import { Tables } from '../../common/constants';
import { UserStatus } from '../../users/user.types';

interface ProfileRow {
  id: string;
  status: UserStatus;
}

const BEARER_PREFIX = 'Bearer ';

/**
 * Verifies the Supabase access token and builds the request identity.
 *
 * The identity is derived exclusively from the token: the user id is the JWT
 * subject as verified by Supabase, the platform role comes from `app_metadata`
 * (writable only with the service-role key), and the application profile is
 * looked up by that verified auth id. Request bodies are never consulted.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = this.extractBearerToken(request);

    const { data, error } = await this.databaseService.admin.auth.getUser(accessToken);

    if (error || !data.user) {
      // The token itself is never logged.
      this.logger.warn(`Token verification failed: ${error?.message ?? 'no user for token'}`);
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const authUser = data.user;
    const profile = await this.resolveProfile(authUser.id, authUser.email ?? '');

    if (profile.status !== UserStatus.Active) {
      throw new ForbiddenException('This account is not active');
    }

    const authContext: AuthContext = {
      authUserId: authUser.id,
      profileId: profile.id,
      email: authUser.email ?? '',
      // app_metadata is server-controlled; user_metadata is client-writable and
      // must never be trusted for authorization decisions.
      role: parseRole(authUser.app_metadata?.['app_role'], Role.USER),
      accessToken,
    };

    request.user = authContext;
    return true;
  }

  private extractBearerToken(request: AuthenticatedRequest): string {
    const header = request.headers['authorization'];
    const value = Array.isArray(header) ? header[0] : header;

    if (!value || !value.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    const token = value.slice(BEARER_PREFIX.length).trim();
    if (token.length === 0) {
      throw new UnauthorizedException('Missing access token');
    }
    return token;
  }

  /**
   * Finds the application profile for a verified auth user, provisioning one on
   * first use so that a Supabase-created account is always usable.
   */
  private async resolveProfile(authUserId: string, email: string): Promise<ProfileRow> {
    const existing = await this.databaseService.admin
      .from(Tables.USERS)
      .select('id, status')
      .eq('auth_user_id', authUserId)
      .maybeSingle<ProfileRow>();

    if (existing.error) {
      this.logger.error(`Profile lookup failed: ${existing.error.message}`);
      throw new UnauthorizedException('Unable to resolve the account profile');
    }

    if (existing.data) {
      return existing.data;
    }

    const created = await this.databaseService.admin
      .from(Tables.USERS)
      .insert({ auth_user_id: authUserId, email, status: UserStatus.Active })
      .select('id, status')
      .single<ProfileRow>();

    if (created.error || !created.data) {
      this.logger.error(`Profile provisioning failed: ${created.error?.message ?? 'no row returned'}`);
      throw new UnauthorizedException('Unable to resolve the account profile');
    }

    return created.data;
  }
}
