/**
 * The channel has no provider in this environment (email until TQ-17, push until FCM
 * credentials are set). The delivery is recorded as SKIPPED and not retried.
 */
export class ChannelNotConfiguredError extends Error {
  constructor(channel: string) {
    super(`${channel} is not configured in this environment`);
    this.name = 'ChannelNotConfiguredError';
  }
}
