import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Actor, requireMember } from '../../../common/context/actor';
import { parseInput } from '../../../common/validation/parse-input';
import type { Profile } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner } from '../../../platform/database';
import { AuditActorType, AuditLogger } from '../../audit';
import { MembersService } from '../../identity';

const INTERESTS = ['TECH_INNOVATION', 'MARKETING', 'DESIGN', 'BUSINESS', 'NETWORKING', 'PRODUCTION'] as const;

const updateSchema = z
  .object({
    name: z.string().trim().min(2, 'must be at least 2 characters').max(120),
    headline: z.string().trim().max(120, 'must be at most 120 characters'),
    city: z.string().trim().max(100, 'must be at most 100 characters'),
    about: z.string().trim().max(600, 'must be at most 600 characters'),
    profile_status: z.enum(['PROFESSIONAL', 'STUDENT']),
    interests: z
      .array(z.enum(INTERESTS))
      .max(INTERESTS.length)
      .refine((items) => new Set(items).size === items.length, 'must not repeat an interest'),
    contact_privacy: z
      .object({ share_email: z.boolean().default(false), share_phone: z.boolean().default(false) })
      .strict(),
  })
  .strict();

/** An individual's own profile (contracts/app `Profile`). */
export interface ProfileView {
  name: string;
  headline: string;
  company: string | null;
  city: string;
  industry: string | null;
  about: string;
  profileStatus: 'PROFESSIONAL' | 'STUDENT';
  /** Verification arrives with Phase 3b/4. */
  verified: boolean;
  verificationLevel: number;
  availabilityNote: string | null;
  interests: string[];
  contactPrivacy: { shareEmail: boolean; sharePhone: boolean };
}

/**
 * Profiles (contracts/app /me/profile). Name and profile status are identity's; the rest
 * is here. Experience, portfolio and skills have no editing route yet (BQ-85), so they are
 * empty lists.
 */
@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly members: MembersService,
    private readonly audit: AuditLogger,
  ) {}

  async get(actor: Actor | undefined): Promise<ProfileView> {
    const { userId } = requireMember(actor);
    return this.view(userId);
  }

  /** Changing `profile_status` applies to every later eligibility check (BQ-79). */
  async update(actor: Actor | undefined, input: unknown): Promise<ProfileView> {
    const { userId } = requireMember(actor);
    const data = parseInput(updateSchema, input);
    await this.transactions.run(async (tx) => {
      const { previousProfileStatus } = await this.members.updateIndividual(tx, userId, {
        fullName: data.name,
        profileStatus: data.profile_status,
      });
      const fields = {
        headline: data.headline,
        city: data.city,
        about: data.about,
        interests: data.interests,
        shareEmail: data.contact_privacy.share_email,
        sharePhone: data.contact_privacy.share_phone,
      };
      await tx.profile.upsert({ where: { userId }, create: { userId, ...fields }, update: fields });
      await this.audit.record({
        actor: { type: AuditActorType.USER, userId },
        action: 'user.profile.update',
        entityType: 'user',
        entityId: userId,
        changes: {
          before: { profile_status: previousProfileStatus },
          after: {
            profile_status: data.profile_status,
            share_email: fields.shareEmail,
            share_phone: fields.sharePhone,
          },
        },
      });
    });
    return this.view(userId);
  }

  /** For `AppUser.headline` (GET /me); null until the member writes one. */
  async headlineOf(userId: string): Promise<string | null> {
    const profile = await this.prisma.profile.findUnique({ where: { userId }, select: { headline: true } });
    return profile?.headline || null;
  }

  private async view(userId: string): Promise<ProfileView> {
    const [member, profile] = await Promise.all([
      this.members.view(userId),
      this.prisma.profile.findUnique({ where: { userId } }),
    ]);
    const p: Partial<Profile> = profile ?? {};
    return {
      name: member.fullName,
      headline: p.headline ?? '',
      company: p.currentCompany ?? null,
      city: p.city ?? '',
      industry: p.industry ?? null,
      about: p.about ?? '',
      profileStatus: member.profileStatus ?? 'PROFESSIONAL',
      verified: false,
      verificationLevel: 0,
      availabilityNote: p.availabilityNote ?? null,
      interests: p.interests ?? [],
      contactPrivacy: { shareEmail: p.shareEmail ?? false, sharePhone: p.sharePhone ?? false },
    };
  }
}
