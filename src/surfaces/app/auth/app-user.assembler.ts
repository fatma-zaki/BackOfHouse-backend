import { Injectable } from '@nestjs/common';
import { CompaniesService, CompanyMembershipView } from '../../../modules/companies';
import { AuthTokens, MembersService } from '../../../modules/identity';

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
 * Headline and avatar arrive with profiles (Phase 3a); individual verification with
 * Phase 3b. A Company Account shows its company's verification.
 */
@Injectable()
export class AppUserAssembler {
  constructor(
    private readonly members: MembersService,
    private readonly companies: CompaniesService,
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
      headline: null,
      avatar_url: null,
      is_verified: membership?.company.is_verified ?? false,
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
