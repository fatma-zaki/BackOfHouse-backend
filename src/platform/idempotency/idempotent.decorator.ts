import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_KEY = 'boh:idempotent';

export interface IdempotentOptions {
  /** When true (default), a request without `Idempotency-Key` gets 400 `IDEMPOTENCY_KEY_REQUIRED`. */
  required?: boolean;
}

/**
 * Marks an operation whose contract declares the `Idempotency-Key` header
 * (apply, register, redeem, respond, points adjustment, award points). The first
 * response is stored for 24 h per caller + key and replayed for repeats.
 */
export const Idempotent = (options: IdempotentOptions = {}): MethodDecorator =>
  SetMetadata(IDEMPOTENT_KEY, { required: true, ...options });
