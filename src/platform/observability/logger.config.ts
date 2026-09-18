import type { Params } from 'nestjs-pino';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppConfig } from '../../config/app.config';
import { LOG_REDACT_PATHS } from './log-redaction';

type RequestWithId = IncomingMessage & { id?: string | number | object };

/**
 * Structured JSON logs with redaction; pretty-printed only for local work.
 * The request id set by requestContextMiddleware becomes `req.id` on every
 * request log line, matching the `trace_id` returned in error bodies.
 */
export function buildLoggerParams(config: AppConfig): Params {
  const pretty = config.app.appEnv === 'local' && config.app.nodeEnv !== 'test';

  return {
    pinoHttp: {
      level: config.app.logLevel,
      redact: { paths: [...LOG_REDACT_PATHS], censor: '[REDACTED]' },
      genReqId: (req: RequestWithId) => (typeof req.id === 'string' ? req.id : 'unknown'),
      customProps: (req: RequestWithId) => ({ trace_id: req.id }),
      autoLogging: { ignore: (req: IncomingMessage) => (req.url ?? '').startsWith('/api/v1/health') },
      // Only method, path and status: no bodies, no query strings (they can carry PII).
      serializers: {
        req: (req: RequestWithId & { method?: string; url?: string }) => ({
          id: req.id,
          method: req.method,
          path: (req.url ?? '').split('?')[0],
        }),
        res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
      },
      ...(pretty ? { transport: { target: 'pino-pretty', options: { singleLine: true } } } : {}),
    },
  };
}
