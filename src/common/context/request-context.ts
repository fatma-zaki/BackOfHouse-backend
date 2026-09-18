import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request context propagated through AsyncLocalStorage (nest-module-map.md
 * §2 `common/context`). The actor and organization are added by the identity
 * and access guards in Stages 4 and 6.
 */
export interface RequestContextState {
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
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
};
