import type { Request } from 'express';
import type { Actor } from '../common/context/actor';

/**
 * Turns a request's credential into an Actor, one resolver per surface
 * (execution-plan.md §1.3):
 *   app   → Bearer access token (Supabase Auth behind /auth/*, ADR-003): MemberTokenResolver
 *   admin → opaque session cookie after Google Workspace sign-in (ADR-032): StaffSessionResolver
 * Null means no valid credential, so every non-public route answers 401.
 * Tests may replace them with `overrideProvider(...)`.
 */
export interface ActorResolver {
  resolve(request: Request): Promise<Actor | null>;
}

export const APP_ACTOR_RESOLVER = Symbol('APP_ACTOR_RESOLVER');
export const ADMIN_ACTOR_RESOLVER = Symbol('ADMIN_ACTOR_RESOLVER');
