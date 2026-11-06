import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { NotFoundError } from '../../../common/errors';
import type { Locale } from '../../../common/i18n/locale';
import { PrismaService } from '../../../platform/database';

/** The account fields of contracts/app `AppUser` that identity owns. */
export interface MemberView {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  accountType: 'INDIVIDUAL' | 'COMPANY';
  profileStatus: 'PROFESSIONAL' | 'STUDENT' | null;
}

/** What a notification needs to reach a member. */
export interface MemberContact {
  id: string;
  fullName: string;
  email: string;
  locale: Locale;
  isActive: boolean;
}

/** Codes are kept a day for the rate-limit windows and support questions. */
const CODE_RETENTION_MS = 24 * 3600_000;

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async view(userId: string): Promise<MemberView> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Account not found');
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      accountType: user.accountType,
      profileStatus: user.profileStatus,
    };
  }

  /** Contact details and language, or null when the account does not exist. */
  async contact(userId: string): Promise<MemberContact | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, locale: true, status: true },
    });
    if (!user) return null;
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      locale: user.locale === 'ar' ? 'ar' : 'en',
      isActive: user.status === 'ACTIVE',
    };
  }

  /** The ids among `userIds` that belong to ACTIVE accounts. */
  async activeIds(userIds: readonly string[]): Promise<string[]> {
    if (userIds.length === 0) return [];
    const users = await this.prisma.user.findMany({
      where: { id: { in: [...userIds] }, status: 'ACTIVE' },
      select: { id: true },
    });
    return users.map((user) => user.id);
  }

  /** Hourly job `identity.purge`: old sign-in codes and revoked sessions whose tokens expired. */
  async purge(): Promise<{ codes: number; sessions: number }> {
    const now = this.clock.now();
    const codes = await this.prisma.phoneSignInCode.deleteMany({
      where: { createdAt: { lt: new Date(now.getTime() - CODE_RETENTION_MS) } },
    });
    const sessions = await this.prisma.revokedMemberSession.deleteMany({ where: { expiresAt: { lt: now } } });
    return { codes: codes.count, sessions: sessions.count };
  }
}
