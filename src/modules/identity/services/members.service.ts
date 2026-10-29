import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { NotFoundError } from '../../../common/errors';
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
