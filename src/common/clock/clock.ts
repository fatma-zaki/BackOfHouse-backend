/**
 * The current time, injectable so tests can move it (session idle timeouts,
 * expiry). Production uses SystemClock.
 */
export interface Clock {
  now(): Date;
}

export const CLOCK = Symbol('CLOCK');

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
