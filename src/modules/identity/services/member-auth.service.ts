import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import type { Actor } from '../../../common/context/actor';
import {
  ConflictError,
  DomainError,
  ErrorCode,
  FieldErrors,
  UnauthenticatedError,
  ValidationFailedError,
} from '../../../common/errors';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner, Tx } from '../../../platform/database';
import { AuditActorType, AuditLogger } from '../../audit';
import { normalizePhone } from '../domain/phone-code';
import { AuthTokens, MEMBER_AUTH_PROVIDER, MemberAuthProvider } from '../infrastructure/member-auth-provider';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'must be an email address');
// 72 bytes is the bcrypt limit Supabase Auth hashes with.
const password = z.string().min(8, 'must be at least 8 characters').max(72, 'must be at most 72 characters');
const phone = z.string().transform((value, ctx) => {
  const normalized = normalizePhone(value);
  if (!normalized) ctx.addIssue({ code: 'custom', message: 'must be an international number like +966501234567' });
  return normalized ?? '';
});

const registerSchema = z
  .object({
    full_name: z.string().trim().min(2, 'must be at least 2 characters').max(120),
    email,
    phone,
    password,
    account_type: z.enum(['INDIVIDUAL', 'COMPANY']),
    profile_status: z.enum(['PROFESSIONAL', 'STUDENT']).optional(),
    company: z
      .object({
        name: z.string().trim().min(1, 'is required').max(200),
        company_type: z.enum([
          'EVENT_ORGANIZER',
          'SUPPLIER',
          'VENUE',
          'PRODUCTION',
          'AGENCY',
          'SERVICE_PROVIDER',
          'OTHER',
        ]),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((input, ctx) => {
    if (input.account_type === 'COMPANY') {
      if (!input.company) ctx.addIssue({ code: 'custom', path: ['company'], message: 'is required for a company' });
      if (input.profile_status) {
        ctx.addIssue({ code: 'custom', path: ['profile_status'], message: 'is for individuals only' });
      }
    } else if (input.company) {
      ctx.addIssue({ code: 'custom', path: ['company'], message: 'is for company accounts only' });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/** Runs inside the registration transaction after the user row is written (company creation). */
export type OnRegistered = (tx: Tx, user: { id: string }, input: RegisterInput) => Promise<void>;

const loginSchema = z.object({ email, password: z.string().min(1).max(200), remember_me: z.boolean().optional() });
const refreshSchema = z.object({ refresh_token: z.string().min(1).max(4096) });
const forgotSchema = z.object({ email });
const resetSchema = z.object({ token: z.string().min(1).max(4096), password });

export interface AuthenticatedMember {
  userId: string;
  accountType: 'INDIVIDUAL' | 'COMPANY';
  isStudent: boolean;
  sessionId: string;
  accessToken: string;
  expiresAt: Date;
}

function parse<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const parsed = schema.safeParse(input ?? {});
  if (parsed.success) return parsed.data;
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) (errors[issue.path.join('.') || '(body)'] ??= []).push(issue.message);
  throw new ValidationFailedError(errors);
}

const invalidCredentials = () =>
  new DomainError(ErrorCode.INVALID_CREDENTIALS, 'Wrong email or password', HttpStatus.UNAUTHORIZED);

/**
 * Member sign-in (contracts/app /auth/*, ADR-003 amended, BQ-78). The provider holds
 * credentials and sessions; `users` holds the account. Every session handed out
 * belongs to an ACTIVE `users` row.
 */
@Injectable()
export class MemberAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    @Inject(MEMBER_AUTH_PROVIDER) private readonly provider: MemberAuthProvider,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * Creates the account and signs it in. A COMPANY registration needs `onRegistered`
   * (the companies module creates the company in the same transaction).
   */
  async register(input: unknown, onRegistered?: OnRegistered): Promise<AuthTokens> {
    const data = parse(registerSchema, input);
    if (data.account_type === 'COMPANY' && !onRegistered) {
      throw new Error('Company registration goes through the companies module');
    }
    await this.assertIdentifiersFree(data.email, data.phone);

    const created = await this.provider.createUser({ email: data.email, password: data.password });
    if (!created) throw new ConflictError('This email already has an account', ErrorCode.EMAIL_TAKEN);

    try {
      await this.transactions.run(async (tx) => {
        await tx.user.create({
          data: {
            id: created.userId,
            accountType: data.account_type,
            fullName: data.full_name,
            email: data.email,
            phone: data.phone,
            profileStatus: data.account_type === 'INDIVIDUAL' ? (data.profile_status ?? 'PROFESSIONAL') : null,
          },
        });
        await onRegistered?.(tx, { id: created.userId }, data);
        await this.audit.record({
          actor: { type: AuditActorType.USER, userId: created.userId },
          action: 'user.register',
          entityType: 'user',
          entityId: created.userId,
          changes: { after: { account_type: data.account_type } },
        });
      });
    } catch (error) {
      await this.provider.deleteUser(created.userId);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Another registration took the email or phone in the meantime.
        await this.assertIdentifiersFree(data.email, data.phone);
      }
      throw error;
    }

    const tokens = await this.provider.signInWithPassword(data.email, data.password);
    if (!tokens) throw new Error('Could not sign in a newly registered account');
    await this.touchSignIn(tokens.userId);
    return tokens;
  }

  async login(input: unknown): Promise<AuthTokens> {
    const data = parse(loginSchema, input);
    const tokens = await this.provider.signInWithPassword(data.email, data.password);
    if (!tokens) throw invalidCredentials();
    const user = await this.prisma.user.findUnique({ where: { id: tokens.userId }, select: { status: true } });
    if (user?.status !== 'ACTIVE') {
      await this.provider.signOut(tokens.accessToken);
      throw invalidCredentials();
    }
    await this.touchSignIn(tokens.userId);
    return tokens;
  }

  async refresh(input: unknown): Promise<AuthTokens> {
    const data = parse(refreshSchema, input);
    const tokens = await this.provider.refresh(data.refresh_token);
    if (!tokens) throw new UnauthenticatedError('Refresh token is invalid or expired');
    const user = await this.prisma.user.findUnique({ where: { id: tokens.userId }, select: { status: true } });
    if (user?.status !== 'ACTIVE') {
      await this.provider.signOut(tokens.accessToken);
      throw new UnauthenticatedError();
    }
    return tokens;
  }

  /** Ends the caller's session; its access token is refused from now on (AUTH-02). */
  async logout(member: AuthenticatedMember): Promise<void> {
    await this.provider.signOut(member.accessToken);
    await this.prisma.revokedMemberSession.upsert({
      where: { sessionId: member.sessionId },
      create: { sessionId: member.sessionId, userId: member.userId, expiresAt: member.expiresAt },
      update: {},
    });
  }

  /** Always succeeds, so the answer never reveals whether the email has an account. */
  async forgotPassword(input: unknown): Promise<void> {
    const data = parse(forgotSchema, input);
    const user = await this.prisma.user.findUnique({ where: { email: data.email }, select: { status: true } });
    if (user?.status === 'ACTIVE') await this.provider.sendPasswordReset(data.email);
  }

  /** Sets a new password from the emailed link and ends every session (security-and-audit §2). */
  async resetPassword(input: unknown): Promise<void> {
    const data = parse(resetSchema, input);
    const result = await this.provider.resetPassword(data.token, data.password);
    if (!result) throw new ValidationFailedError({ token: ['is invalid or has expired'] });
    await this.transactions.run(async (tx) => {
      await tx.user.updateMany({ where: { id: result.userId }, data: { sessionsRevokedAt: this.clock.now() } });
      await this.audit.record({
        actor: { type: AuditActorType.USER, userId: result.userId },
        action: 'user.password.reset',
        entityType: 'user',
        entityId: result.userId,
      });
    });
  }

  /**
   * The member behind an access token, or 401: the token must verify, its session must
   * not be signed out, it must be newer than the last password reset, and the account
   * must be ACTIVE.
   */
  async authenticate(accessToken: string): Promise<AuthenticatedMember> {
    const access = await this.provider.verifyAccessToken(accessToken);
    const [user, revoked] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: access.userId },
        select: { status: true, accountType: true, profileStatus: true, sessionsRevokedAt: true },
      }),
      this.prisma.revokedMemberSession.findUnique({
        where: { sessionId: access.sessionId },
        select: { sessionId: true },
      }),
    ]);
    if (
      !user ||
      user.status !== 'ACTIVE' ||
      revoked ||
      (user.sessionsRevokedAt && access.issuedAt.getTime() < user.sessionsRevokedAt.getTime())
    ) {
      throw new UnauthenticatedError();
    }
    return {
      userId: access.userId,
      accountType: user.accountType,
      isStudent: user.profileStatus === 'STUDENT',
      sessionId: access.sessionId,
      accessToken,
      expiresAt: access.expiresAt,
    };
  }

  /** The actor for an authenticated member (individuals; Company Accounts get theirs from companies). */
  static memberActor(member: AuthenticatedMember): Actor {
    return { kind: 'member', userId: member.userId, isStudent: member.isStudent };
  }

  /** A session for an account the API authenticated itself (phone code). */
  async sessionFor(userId: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
    const tokens = await this.provider.createSession({ userId, email: user.email });
    await this.touchSignIn(userId);
    return tokens;
  }

  private async assertIdentifiersFree(emailValue: string, phoneValue: string): Promise<void> {
    const taken = await this.prisma.user.findMany({
      where: { OR: [{ email: emailValue }, { phone: phoneValue }] },
      select: { email: true, phone: true },
    });
    if (taken.some((u) => u.email === emailValue)) {
      throw new ConflictError('This email already has an account', ErrorCode.EMAIL_TAKEN);
    }
    if (taken.some((u) => u.phone === phoneValue)) {
      throw new ConflictError('This phone number already has an account', ErrorCode.PHONE_TAKEN);
    }
  }

  private async touchSignIn(userId: string): Promise<void> {
    await this.prisma.user.updateMany({ where: { id: userId }, data: { lastSignInAt: this.clock.now() } });
  }
}
