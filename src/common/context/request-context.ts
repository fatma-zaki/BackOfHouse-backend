import { AsyncLocalStorage } from 'node:async_hooks';
import type { Actor } from './actor';
import type { Locale } from '../i18n/locale';

/**
 * Per-request context propagated through AsyncLocalStorage (nest-module-map.md
 * §2 `common/context`). The request id, IP, user agent and locale are set by
 * the request-context middleware; the actor by the surface auth guard.
 */
export interface RequestContextState {
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
  locale?: Locale;
  actor?: Actor;
  /** Audit rows written during this request (checked on admin writes, ADR-016). */
  auditWrites?: number;
}

const storage = new AsyncLocalStorage<RequestContextState>();

export const RequestContext = {
  run<T>(state: RequestContextState, callback: () => T): T {
    return storage.run(state, callback);
  },

  current(): RequestContextState | undefined {
    return storage.getStore();
  },

  /** Request id for logs, audit rows and error `trace_id`; `system` outside a request. */
  requestId(): string {
    return storage.getStore()?.requestId ?? 'system';
  },

  /** Language of the current request; English outside a request. */
  locale(): Locale {
    return storage.getStore()?.locale ?? 'en';
  },

  actor(): Actor | undefined {
    return storage.getStore()?.actor;
  },

  setActor(actor: Actor): void {
    const state = storage.getStore();
    if (state) {
      state.actor = actor;
    }
  },

  /** Called by AuditLogger after each row it writes. */
  countAuditWrite(): void {
    const state = storage.getStore();
    if (state) {
      state.auditWrites = (state.auditWrites ?? 0) + 1;
    }
  },

  auditWrites(): number {
    return storage.getStore()?.auditWrites ?? 0;
  },
};
