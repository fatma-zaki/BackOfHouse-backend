import { Injectable } from '@nestjs/common';
import { CompaniesService, CompanyMembershipView } from '../../../modules/companies';
import { AuthTokens, MembersService } from '../../../modules/identity';
import { ProfilesService } from '../../../modules/profiles';
import { VerificationReviewService } from '../../../modules/verification';

/** contracts/app `AppUser`. */
export interface AppUserDto {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  account_type: 'INDIVIDUAL' | 'COMPANY';
  profile_status: 'PROFESSIONAL' | 'STUDENT' | null;
  headline: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  membership: CompanyMembershipView | null;
}

/** contracts/app `Session`. */
export interface SessionDto {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AppUserDto;
}

/**
 * Builds `AppUser` from identity (the account) and companies (the membership).
 * The headline comes from the profile; the avatar with uploads (1B); an individual's
 * `is_verified` from the reviewer's decision (verification module). A Company Account
 * shows its company's verification.
 */
@Injectable()
export class AppUserAssembler {
  constructor(
    private readonly members: MembersService,
    private readonly companies: CompaniesService,
    private readonly profiles: ProfilesService,
    private readonly verification: VerificationReviewService,
  ) {}

  async user(userId: string): Promise<AppUserDto> {
    const member = await this.members.view(userId);
    const membership = member.accountType === 'COMPANY' ? await this.companies.membershipFor(userId) : null;
    return {
      id: member.id,
      full_name: member.fullName,
      email: member.email,
      phone: member.phone,
      account_type: member.accountType,
      profile_status: member.accountType === 'INDIVIDUAL' ? member.profileStatus : null,
      headline: member.accountType === 'INDIVIDUAL' ? await this.profiles.headlineOf(userId) : null,
      avatar_url: null,
      is_verified: membership
        ? membership.company.is_verified
        : (await this.verification.verifiedUserIds([userId])).has(userId),
      membership,
    };
  }

  async session(tokens: AuthTokens): Promise<SessionDto> {
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: tokens.expiresIn,
      user: await this.user(tokens.userId),
    };
  }
}
