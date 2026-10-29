import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { Actor } from '../../../common/context/actor';
import { parseCookies } from '../../../common/http/cookies';
import { ADMIN_CSRF_COOKIE, ADMIN_SESSION_COOKIE, CSRF_HEADER, StaffSessionsService } from '../../../modules/access';
import type { ActorResolver } from '../../actor-resolver';

/** Request property holding the resolved admin session id (for sign-out). */
export const ADMIN_SESSION_ID = 'bohAdminSessionId';

/**
 * Admin surface credential (ADR-032): the opaque session cookie, plus the
 * double-submit CSRF token on writes. Bearer tokens are never accepted here.
 */
@Injectable()
export class StaffSessionResolver implements ActorResolver {
  constructor(private readonly sessions: StaffSessionsService) {}

  async resolve(request: Request): Promise<Actor | null> {
    const cookies = parseCookies(request.headers.cookie);
    const header = request.headers[CSRF_HEADER];
    const resolved = await this.sessions.resolve({
      token: cookies[ADMIN_SESSION_COOKIE],
      method: request.method,
      csrfHeader: Array.isArray(header) ? header[0] : header,
      csrfCookie: cookies[ADMIN_CSRF_COOKIE],
    });
    if (!resolved) return null;
    const { sessionId, ...actor } = resolved;
    (request as Request & Record<string, unknown>)[ADMIN_SESSION_ID] = sessionId;
    return actor;
  }
}
