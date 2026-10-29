import { HttpStatus, Logger } from '@nestjs/common';
import { DomainError, ErrorCode } from '../../../common/errors';
import { maskPhone } from '../../audit';

/** Sends one SMS. The provider for Saudi numbers is open (TQ-04). */
export interface SmsSender {
  send(phone: string, text: string): Promise<void>;
}

export const SMS_SENDER = Symbol('SMS_SENDER');

/**
 * Local and test: keeps messages in memory (`sent`) and logs them in local, so
 * developers can sign in by phone without an SMS provider. Never used in staging or
 * production.
 */
export class DevSmsSender implements SmsSender {
  readonly sent: { phone: string; text: string }[] = [];
  private readonly logger = new Logger(DevSmsSender.name);

  constructor(private readonly logMessages: boolean) {}

  async send(phone: string, text: string): Promise<void> {
    this.sent.push({ phone, text });
    if (this.logMessages) this.logger.log(`SMS to ${maskPhone(phone)}: ${text}`);
  }
}

/** Staging and production until TQ-04 picks a provider: phone sign-in answers 503. */
export class NotConfiguredSmsSender implements SmsSender {
  async send(): Promise<void> {
    throw new DomainError(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Phone sign-in is not available yet',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
