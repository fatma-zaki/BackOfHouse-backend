import { Injectable, Logger } from '@nestjs/common';
import type { Session, User } from '@supabase/supabase-js';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';
import { Tables } from '../common/constants';
import {
  BadRequestException,
  ConflictException,
  InternalOperationException,
  UnauthorizedException,
} from '../common/exceptions/business.exceptions';
import { Role, parseRole } from './decorators/permissions.enum';
import { AuthContext } from './types/auth-context';
import {
  AuthenticatedUserPayload,
  LoginResult,
  SessionPayload,
  SignUpResult,
} from './types/auth-response';
import {
  LoginDto,
  RequestPasswordResetDto,
  ResendVerificationDto,
  SignUpDto,
  UpdatePasswordDto,
} from './dto/auth.dto';
import { UserStatus } from '../users/user.types';

const DUPLICATE_ACCOUNT_HINTS = ['already registered', 'already exists', 'user_repeated_signup'];

/**
 * Wraps Supabase Auth.
 *
 * Credentials never touch this database: Supabase owns password hashing,
 * session issuance and email verification. This service only mirrors the
 * minimum profile data and assigns the platform role in `app_metadata`.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async signUp(dto: SignUpDto): Promise<SignUpResult> {
    const { data, error } = await this.databaseService.anon.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          first_name: dto.first_name ?? null,
          last_name: dto.last_name ?? null,
        },
      },
    });

    if (error || !data.user) {
      if (error && DUPLICATE_ACCOUNT_HINTS.some((hint) => error.message.toLowerCase().includes(hint))) {
        throw new ConflictException('An account with this email already exists');
      }
      // Passwords are never included in log output.
      this.logger.warn(`Sign-up rejected: ${error?.message ?? 'no user returned'}`);
      throw new BadRequestException('Unable to create the account');
    }

    // The platform role lives in app_metadata, which is writable only with the
    // service-role key, so a client cannot grant itself a role.
    await this.assignDefaultRole(data.user.id);
    const profileId = await this.ensureProfile(data.user.id, {
      email: dto.email,
      first_name: dto.first_name,
      last_name: dto.last_name,
    });

    await this.auditService.log({
      actor_id: profileId,
      action: AuditAction.SIGNUP,
      entity_type: 'user',
      entity_id: profileId,
    });

    return {
      user: this.toUserPayload(data.user, profileId, Role.USER),
      session: data.session ? this.toSessionPayload(data.session) : null,
      email_verification_required: data.session === null,
    };
  }

  async signIn(dto: LoginDto): Promise<LoginResult> {
    const { data, error } = await this.databaseService.anon.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.session || !data.user) {
      this.logger.warn(`Failed login attempt: ${error?.message ?? 'no session returned'}`);
      // Identical message for unknown email and wrong password (no user enumeration).
      throw new UnauthorizedException('Invalid email or password');
    }

    const profileId = await this.ensureProfile(data.user.id, { email: dto.email });
    const role = parseRole(data.user.app_metadata?.['app_role'], Role.USER);

    await this.auditService.log({
      actor_id: profileId,
      action: AuditAction.LOGIN,
      entity_type: 'user',
      entity_id: profileId,
    });

    return {
      user: this.toUserPayload(data.user, profileId, role),
      session: this.toSessionPayload(data.session),
    };
  }

  async signOut(context: AuthContext): Promise<void> {
    // Revokes the refresh tokens issued for this session, server-side.
    const { error } = await this.databaseService.admin.auth.admin.signOut(context.accessToken);

    if (error) {
      this.logger.warn(`Sign-out returned an error: ${error.message}`);
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.LOGOUT,
      entity_type: 'user',
      entity_id: context.profileId,
    });
  }

  async refreshSession(refreshToken: string): Promise<SessionPayload> {
    const { data, error } = await this.databaseService.anon.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.toSessionPayload(data.session);
  }

  /**
   * Always resolves, whether or not the address exists, so the endpoint cannot
   * be used to discover which email addresses are registered.
   */
  async requestPasswordReset(dto: RequestPasswordResetDto): Promise<void> {
    const { error } = await this.databaseService.anon.auth.resetPasswordForEmail(dto.email);

    if (error) {
      this.logger.warn(`Password reset request failed: ${error.message}`);
    }
  }

  async updatePassword(context: AuthContext, dto: UpdatePasswordDto): Promise<void> {
    // Performed as the user so Supabase enforces its own session rules.
    const { error } = await this.databaseService
      .forUser(context.accessToken)
      .auth.updateUser({ password: dto.password });

    if (error) {
      this.logger.warn(`Password update failed: ${error.message}`);
      throw new BadRequestException('Unable to update the password');
    }

    await this.auditService.log({
      actor_id: context.profileId,
      action: AuditAction.PASSWORD_UPDATE,
      entity_type: 'user',
      entity_id: context.profileId,
    });
  }

  async resendVerificationEmail(dto: ResendVerificationDto): Promise<void> {
    const { error } = await this.databaseService.anon.auth.resend({
      type: 'signup',
      email: dto.email,
    });

    if (error) {
      this.logger.warn(`Verification resend failed: ${error.message}`);
    }
  }

  async getCurrentUser(context: AuthContext): Promise<AuthenticatedUserPayload> {
    const { data, error } = await this.databaseService.admin.auth.admin.getUserById(
      context.authUserId,
    );

    if (error || !data.user) {
      throw new InternalOperationException('Unable to load the account');
    }

    return this.toUserPayload(data.user, context.profileId, context.role);
  }

  private async assignDefaultRole(authUserId: string): Promise<void> {
    const { error } = await this.databaseService.admin.auth.admin.updateUserById(authUserId, {
      app_metadata: { app_role: Role.USER },
    });

    if (error) {
      this.logger.error(`Failed to assign the default role: ${error.message}`);
      throw new InternalOperationException('Unable to complete account setup');
    }
  }

  /** Creates the application profile if it does not exist yet, and returns its id. */
  private async ensureProfile(
    authUserId: string,
    profile: { email: string; first_name?: string; last_name?: string },
  ): Promise<string> {
    const existing = await this.databaseService.admin
      .from(Tables.USERS)
      .select('id')
      .eq('auth_user_id', authUserId)
      .maybeSingle<{ id: string }>();

    if (existing.data) {
      return existing.data.id;
    }

    const created = await this.databaseService.admin
      .from(Tables.USERS)
      .insert({
        auth_user_id: authUserId,
        email: profile.email,
        first_name: profile.first_name ?? null,
        last_name: profile.last_name ?? null,
        status: UserStatus.Active,
      })
      .select('id')
      .single<{ id: string }>();

    if (created.error || !created.data) {
      this.logger.error(`Profile creation failed: ${created.error?.message ?? 'no row returned'}`);
      throw new InternalOperationException('Unable to complete account setup');
    }

    return created.data.id;
  }

  private toSessionPayload(session: Session): SessionPayload {
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      token_type: 'bearer',
    };
  }

  private toUserPayload(user: User, profileId: string, role: Role): AuthenticatedUserPayload {
    return {
      id: profileId,
      auth_user_id: user.id,
      email: user.email ?? '',
      role,
      email_verified: Boolean(user.email_confirmed_at),
    };
  }
}
