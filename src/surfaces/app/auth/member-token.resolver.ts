import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { Actor } from '../../../common/context/actor';
import { DomainError } from '../../../common/errors';
import { CompaniesService, COMPANY_PERMISSIONS } from '../../../modules/companies';
import { ActivityService, AuthenticatedMember, MemberAuthService } from '../../../modules/identity';
import type { ActorResolver } from '../../actor-resolver';

/** Request property holding the authenticated member (for sign-out). */
export const APP_MEMBER = 'bohAppMember';

/** The authenticated member of a request that passed the app surface guard. */
export function memberOf(request: Request): AuthenticatedMember {
  return (request as Request & Record<string, unknown>)[APP_MEMBER] as AuthenticatedMember;
}

/**
 * App surface credential (ADR-003 amended): `Authorization: Bearer <access token>`.
 * Cookies are never accepted here. INDIVIDUAL accounts become `member` actors and
 * COMPANY accounts `company` actors with their company (ADR-030). Every resolved
 * request counts towards activity tracking.
 */
@Injectable()
export class MemberTokenResolver implements ActorResolver {
  constructor(
    private readonly auth: MemberAuthService,
    private readonly companies: CompaniesService,
    private readonly activity: ActivityService,
  ) {}

  async resolve(request: Request): Promise<Actor | null> {
    const match = /^Bearer ([^\s]+)$/i.exec(request.headers.authorization ?? '');
    if (!match) return null;

    let member: AuthenticatedMember;
    try {
      member = await this.auth.authenticate(match[1]);
    } catch (error) {
      if (error instanceof DomainError) return null;
      throw error;
    }

    let actor: Actor;
    if (member.accountType === 'COMPANY') {
      const companyId = await this.companies.companyIdFor(member.userId);
      if (!companyId) return null;
      actor = { kind: 'company', userId: member.userId, companyId, permissions: [...COMPANY_PERMISSIONS] };
    } else {
      actor = MemberAuthService.memberActor(member);
    }

    (request as Request & Record<string, unknown>)[APP_MEMBER] = member;
    await this.activity.touch(member.userId);
    return actor;
  }
}
