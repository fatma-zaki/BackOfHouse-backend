import { Logger } from '@nestjs/common';
import { ChannelNotConfiguredError } from './channel-errors';

export interface PushMessage {
  /** FCM registration tokens of one member's devices. */
  tokens: string[];
  title: string;
  body: string;
  /** Read by the app to open the right screen. FCM data values are strings. */
  data: Record<string, string>;
}

export interface PushTokenResult {
  token: string;
  outcome: 'SENT' | 'UNREGISTERED' | 'ERROR';
  messageId?: string;
  error?: string;
}

/** Sends one push to each token (Firebase Cloud Messaging in staging and production). */
export interface PushSender {
  readonly provider: string;
  send(message: PushMessage): Promise<PushTokenResult[]>;
}

export const PUSH_SENDER = Symbol('PUSH_SENDER');

/**
 * Local and test: records every call (`calls`) and logs the title in local. Tokens in
 * `unregistered` answer as FCM does for an uninstalled app.
 */
export class FakePushSender implements PushSender {
  readonly provider = 'fake';
  readonly calls: PushMessage[] = [];
  readonly unregistered = new Set<string>();
  private readonly logger = new Logger(FakePushSender.name);

  constructor(private readonly logMessages: boolean) {}

  async send(message: PushMessage): Promise<PushTokenResult[]> {
    this.calls.push(message);
    if (this.logMessages) this.logger.log(`Push to ${message.tokens.length} device(s): ${message.title}`);
    return message.tokens.map((token, index) =>
      this.unregistered.has(token)
        ? { token, outcome: 'UNREGISTERED' }
        : { token, outcome: 'SENT', messageId: `fake-${this.calls.length}-${index}` },
    );
  }

  clear(): void {
    this.calls.length = 0;
    this.unregistered.clear();
  }
}

/** Staging and production without FCM credentials: push deliveries are SKIPPED. */
export class NotConfiguredPushSender implements PushSender {
  readonly provider = 'none';

  async send(): Promise<PushTokenResult[]> {
    throw new ChannelNotConfiguredError('Push');
  }
}
