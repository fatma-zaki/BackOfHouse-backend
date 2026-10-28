import type { Request } from 'express';
import type { Actor } from '../common/context/actor';

/**
 * Turns a request's credential into an Actor, one resolver per surface
 * (execution-plan.md §1.3):
 *   app   → member JWT (Supabase Auth behind /auth/*), Phase 2
 *   admin → opaque session cookie after Google Workspace sign-in (ADR-032), Phase 2
 * Until Phase 2 both return null, so every non-public route answers 401.
 * Tests replace them with `overrideProvider(...)`.
 */
export interface ActorResolver {
  resolve(request: Request): Promise<Actor | null>;
}

export const APP_ACTOR_RESOLVER = Symbol('APP_ACTOR_RESOLVER');
export const ADMIN_ACTOR_RESOLVER = Symbol('ADMIN_ACTOR_RESOLVER');

export class NoCredentialResolver implements ActorResolver {
  async resolve(): Promise<Actor | null> {
    return null;
  }
}
