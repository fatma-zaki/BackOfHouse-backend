import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { FieldErrors, ValidationFailedError } from '../../../common/errors';
import { PrismaService } from '../../../platform/database';

const deviceSchema = z
  .object({
    token: z.string().trim().min(1, 'is required').max(4096),
    platform: z.enum(['IOS', 'ANDROID']),
  })
  .strict();

/**
 * FCM tokens of members' phones. The route (`PUT /me/devices`) waits for the Flutter
 * contract (README §8 question 3); until then this service is the whole API.
 */
@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Registers or refreshes a token. A token seen under another member moves to this one. */
  async register(userId: string, input: unknown): Promise<void> {
    const parsed = deviceSchema.safeParse(input ?? {});
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) (errors[issue.path.join('.') || '(body)'] ??= []).push(issue.message);
      throw new ValidationFailedError(errors);
    }
    const { token, platform } = parsed.data;
    const now = this.clock.now();
    await this.prisma.memberDevice.upsert({
      where: { token },
      create: { userId, token, platform, lastSeenAt: now, createdAt: now },
      update: { userId, platform, lastSeenAt: now },
    });
  }

  /** Forgets a token (sign-out on that phone). */
  async remove(userId: string, token: string): Promise<void> {
    await this.prisma.memberDevice.deleteMany({ where: { userId, token } });
  }
}
