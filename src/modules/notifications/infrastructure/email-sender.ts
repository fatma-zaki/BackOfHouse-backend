import { Logger } from '@nestjs/common';
import { maskEmail } from '../../audit';
import { ChannelNotConfiguredError } from './channel-errors';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  /** `ar` mails are sent right to left by the provider adapter. */
  locale: 'en' | 'ar';
}

/** Sends one email. The provider is open (TQ-17). */
export interface EmailSender {
  readonly provider: string;
  /** The provider's message id. */
  send(message: EmailMessage): Promise<string>;
}

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

/** Local and test: keeps messages in memory (`sent`) and logs the subject in local. */
export class DevEmailSender implements EmailSender {
  readonly provider = 'dev';
  readonly sent: EmailMessage[] = [];
  private readonly logger = new Logger(DevEmailSender.name);

  constructor(private readonly logMessages: boolean) {}

  async send(message: EmailMessage): Promise<string> {
    this.sent.push(message);
    if (this.logMessages) this.logger.log(`Email to ${maskEmail(message.to)}: ${message.subject}`);
    return `dev-${this.sent.length}`;
  }

  clear(): void {
    this.sent.length = 0;
  }
}

/** Staging and production until TQ-17 picks a provider: email deliveries are SKIPPED. */
export class NotConfiguredEmailSender implements EmailSender {
  readonly provider = 'none';

  async send(): Promise<string> {
    throw new ChannelNotConfiguredError('Email');
  }
}
