import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { safeEqual, sha256Hex } from '../../../common/crypto/tokens';
import { DomainError, ErrorCode, RateLimitedError, ValidationFailedError } from '../../../common/errors';
import type { Locale } from '../../../common/i18n/locale';
import { PrismaService, TransactionRunner } from '../../../platform/database';
import { maskPhone } from '../../audit';
import { normalizePhone, PHONE_CODE } from '../domain/phone-code';
import type { AuthTokens } from '../infrastructure/member-auth-provider';
import { SMS_SENDER, SmsSender } from '../infrastructure/sms-sender';
import { MemberAuthService } from './member-auth.service';

const HOUR_MS = 3600_000;

const invalidCode = () =>
  new DomainError(ErrorCode.INVALID_CODE, 'Wrong or expired code', HttpStatus.UNPROCESSABLE_ENTITY);

const codeHash = (codeId: string, code: string) => sha256Hex(`${codeId}:${code}`);

const message = (code: string, locale: Locale) =>
  locale === 'ar'
    ? `رمز الدخول إلى Back of House هو ${code}. صالح لمدة ${PHONE_CODE.ttlSeconds / 60} دقائق. لا تشاركه مع أحد.`
    : `Your Back of House sign-in code is ${code}. It expires in ${PHONE_CODE.ttlSeconds / 60} minutes. Do not share it.`;

/**
 * Phone + SMS code sign-in (contracts/app /auth/phone/code and /auth/phone/verify,
 * BQ-78). Limits per phone number and per IP, a 5-minute expiry, an attempt cap per
 * code, and a new code replaces the previous one. Answers never reveal whether a
 * number has an account.
 */
@Injectable()
export class PhoneSignInService {
  private readonly logger = new Logger(PhoneSignInService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly auth: MemberAuthService,
    @Inject(SMS_SENDER) private readonly sms: SmsSender,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async sendCode(input: unknown, context: { ip: string | undefined; locale: Locale }): Promise<void> {
    const phone = this.phoneOf(input);
    const ipHash = sha256Hex(context.ip ?? 'unknown');
    const now = this.clock.now();
    const hourAgo = new Date(now.getTime() - HOUR_MS);

    const [byPhone, byIp] = await Promise.all([
      this.prisma.phoneSignInCode.findMany({
        where: { phone, createdAt: { gt: hourAgo } },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      this.prisma.phoneSignInCode.findMany({
        where: { ipHash, createdAt: { gt: hourAgo } },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
        take: PHONE_CODE.maxPerIpPerHour,
      }),
    ]);
    const secondsUntil = (at: Date) => (at.getTime() - now.getTime()) / 1000;
    const windowEnd = (first: { createdAt: Date }) => new Date(first.createdAt.getTime() + HOUR_MS);
    if (byPhone.length >= PHONE_CODE.maxPerPhonePerHour)
      throw new RateLimitedError(secondsUntil(windowEnd(byPhone[0])));
    if (byIp.length >= PHONE_CODE.maxPerIpPerHour) throw new RateLimitedError(secondsUntil(windowEnd(byIp[0])));
    const last = byPhone.at(-1);
    if (last) {
      const nextAllowed = new Date(last.createdAt.getTime() + PHONE_CODE.resendAfterSeconds * 1000);
      if (nextAllowed > now) throw new RateLimitedError(secondsUntil(nextAllowed));
    }

    const user = await this.prisma.user.findUnique({ where: { phone }, select: { id: true, status: true } });
    const account = user?.status === 'ACTIVE' ? user : null;
    const code = String(randomInt(0, 10 ** PHONE_CODE.length)).padStart(PHONE_CODE.length, '0');

    await this.transactions.run(async (tx) => {
      await tx.phoneSignInCode.updateMany({
        where: { phone, closedAt: null },
        data: { closedAt: now, closeReason: 'REPLACED' },
      });
      const row = await tx.phoneSignInCode.create({
        data: {
          phone,
          userId: account?.id ?? null,
          ipHash,
          createdAt: now,
          expiresAt: new Date(now.getTime() + PHONE_CODE.ttlSeconds * 1000),
        },
      });
      if (account) {
        await tx.phoneSignInCode.update({ where: { id: row.id }, data: { codeHash: codeHash(row.id, code) } });
      }
    });

    if (account) {
      await this.sms.send(phone, message(code, context.locale));
    } else {
      this.logger.log(`Sign-in code requested for ${maskPhone(phone)}, which has no active account; nothing sent`);
    }
  }

  async verify(input: unknown): Promise<AuthTokens> {
    const data = z.object({ phone: z.string(), code: z.string() }).safeParse(input ?? {});
    if (!data.success) throw new ValidationFailedError({ '(body)': ['phone and code are required'] });
    if (!/^\d{6}$/.test(data.data.code)) throw new ValidationFailedError({ code: ['must be 6 digits'] });
    const phone = normalizePhone(data.data.phone);
    if (!phone) throw invalidCode();
    const now = this.clock.now();

    const latest = await this.prisma.phoneSignInCode.findFirst({ where: { phone }, orderBy: { createdAt: 'desc' } });
    if (!latest) throw invalidCode();
    if (latest.closeReason === 'BURNED') {
      // The cap was reached on this code: a new one must be requested.
      const nextAllowed = latest.createdAt.getTime() + PHONE_CODE.resendAfterSeconds * 1000;
      throw new RateLimitedError((nextAllowed - now.getTime()) / 1000, 'Too many wrong codes; request a new code');
    }
    if (latest.closedAt) throw invalidCode();
    if (latest.expiresAt <= now) {
      await this.prisma.phoneSignInCode.updateMany({
        where: { id: latest.id, closedAt: null },
        data: { closedAt: now, closeReason: 'EXPIRED' },
      });
      throw invalidCode();
    }

    const matches = latest.codeHash !== null && safeEqual(latest.codeHash, codeHash(latest.id, data.data.code));
    if (!matches) {
      // Atomic, so parallel guesses cannot exceed the cap.
      const counted = await this.prisma.phoneSignInCode.updateMany({
        where: { id: latest.id, closedAt: null, attempts: { lt: PHONE_CODE.maxAttempts } },
        data: { attempts: { increment: 1 } },
      });
      if (counted.count === 1) {
        await this.prisma.phoneSignInCode.updateMany({
          where: { id: latest.id, closedAt: null, attempts: { gte: PHONE_CODE.maxAttempts } },
          data: { closedAt: now, closeReason: 'BURNED' },
        });
      }
      throw invalidCode();
    }

    // Single use: only one request can close it.
    const used = await this.prisma.phoneSignInCode.updateMany({
      where: { id: latest.id, closedAt: null },
      data: { closedAt: now, closeReason: 'USED' },
    });
    if (used.count !== 1 || !latest.userId) throw invalidCode();
    const user = await this.prisma.user.findUnique({ where: { id: latest.userId }, select: { status: true } });
    if (user?.status !== 'ACTIVE') throw invalidCode();
    await this.prisma.user.updateMany({
      where: { id: latest.userId, phoneVerifiedAt: null },
      data: { phoneVerifiedAt: now },
    });
    return this.auth.sessionFor(latest.userId);
  }

  private phoneOf(input: unknown): string {
    const value = (input as { phone?: unknown } | null)?.phone;
    const phone = typeof value === 'string' ? normalizePhone(value) : null;
    if (!phone) throw new ValidationFailedError({ phone: ['must be an international number like +966501234567'] });
    return phone;
  }
}
