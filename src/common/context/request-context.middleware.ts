import type { NextFunction, Request, Response } from 'express';
import { RequestContext } from './request-context';
import { uuidv7 } from '../ids/uuid-v7';

export const REQUEST_ID_HEADER = 'x-request-id';

/** A client may supply its own correlation id; anything unusual is replaced. */
const SAFE_CLIENT_ID = /^[A-Za-z0-9._-]{8,128}$/;

export function resolveRequestId(header: string | string[] | undefined): string {
  const candidate = Array.isArray(header) ? header[0] : header;
  return candidate && SAFE_CLIENT_ID.test(candidate) ? candidate : uuidv7();
}

/**
 * First middleware in the chain: assigns the request id (echoed to the client
 * as `X-Request-Id` and in error bodies as `trace_id`, api-map.md §1.4) and
 * opens the AsyncLocalStorage scope used by logging, audit and the outbox.
 */
export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = resolveRequestId(req.headers[REQUEST_ID_HEADER]);
  (req as Request & { id: string }).id = requestId;
  res.setHeader('X-Request-Id', requestId);

  RequestContext.run({ requestId, ipAddress: req.ip, userAgent: req.headers['user-agent'] }, () => next());
}
