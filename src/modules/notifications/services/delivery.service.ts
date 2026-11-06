import { Inject, Injectable, Logger } from '@nestjs/common';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { scrubSecrets } from '../../../common/text';
import { PrismaService } from '../../../platform/database';
import { maskEmail } from '../../audit';
import { MemberContact, MembersService } from '../../identity';
import { catalogEntry, isKnownType, NotificationChannel } from '../domain/catalog';
import { MAX_DELIVERY_ATTEMPTS, retryDelaySeconds } from '../domain/delivery-plan';
import { renderTemplate, TemplateVars } from '../domain/template';
import { ChannelNotConfiguredError } from '../infrastructure/channel-errors';
import { EMAIL_SENDER, EmailSender } from '../infrastructure/email-sender';
import { PUSH_SENDER, PushSender } from '../infrastructure/push-sender';

interface ClaimedDelivery {
  id: string;
  notification_id: string;
  channel: NotificationChannel;
  attempts: number;
}

type Outcome =
  | { status: 'SENT'; provider: string; providerMessageId: string | null; destinationMasked: string }
  | { status: 'SKIPPED'; reason: string };

export interface DeliveryRun {
  claimed: number;
  sent: number;
  skipped: number;
  retried: number;
  failed: number;
}

/** While one worker sends a delivery, others skip it; a crashed worker's lease expires. */
const LEASE_SECONDS = 120;
const DEFAULT_BATCH = 50;
const MAX_ERROR_LENGTH = 500;

/**
 * Sends QUEUED push and email deliveries that are due, in the recipient's language.
 * Rows are claimed with FOR UPDATE SKIP LOCKED and leased, as the outbox does, so the
 * handler and the `notifications.deliver` job never send the same row twice.
 */
@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly members: MembersService,
    @Inject(PUSH_SENDER) private readonly push: PushSender,
    @Inject(EMAIL_SENDER) private readonly email: EmailSender,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async deliverDue(options: { notificationIds?: string[]; limit?: number } = {}): Promise<DeliveryRun> {
    const claimed = await this.claim(options.notificationIds ?? null, options.limit ?? DEFAULT_BATCH);
    const run: DeliveryRun = { claimed: claimed.length, sent: 0, skipped: 0, retried: 0, failed: 0 };
    for (const delivery of claimed) {
      const result = await this.deliverOne(delivery);
      run[result] += 1;
    }
    return run;
  }

  private claim(notificationIds: string[] | null, limit: number): Promise<ClaimedDelivery[]> {
    const now = this.clock.now();
    const leaseUntil = new Date(now.getTime() + LEASE_SECONDS * 1000);
    return this.prisma.$queryRaw<ClaimedDelivery[]>`
      UPDATE app.notification_deliveries AS d
      SET attempts = d.attempts + 1, next_attempt_at = ${leaseUntil}, updated_at = ${now}
      WHERE d.id IN (
        SELECT id FROM app.notification_deliveries
        WHERE status = 'QUEUED' AND next_attempt_at <= ${now}
          AND (${notificationIds}::uuid[] IS NULL OR notification_id = ANY(${notificationIds}::uuid[]))
        ORDER BY next_attempt_at, id
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING d.id, d.notification_id, d.channel::text AS channel, d.attempts
    `;
  }

  private async deliverOne(delivery: ClaimedDelivery): Promise<'sent' | 'skipped' | 'retried' | 'failed'> {
    let outcome: Outcome;
    try {
      outcome = await this.send(delivery);
    } catch (error) {
      if (error instanceof ChannelNotConfiguredError) {
        // Alerting hooks onto this log line until a monitoring provider is chosen (TQ-09).
        this.logger.warn({ channel: delivery.channel, alert: 'notifications.channel.not_configured' }, error.message);
        outcome = { status: 'SKIPPED', reason: error.message };
      } else {
        return this.recordFailure(delivery, error);
      }
    }

    const now = this.clock.now();
    if (outcome.status === 'SENT') {
      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'SENT',
          sentAt: now,
          provider: outcome.provider,
          providerMessageId: outcome.providerMessageId,
          destinationMasked: outcome.destinationMasked,
          lastError: null,
        },
      });
      return 'sent';
    }
    await this.prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { status: 'SKIPPED', lastError: outcome.reason },
    });
    return 'skipped';
  }

  private async send(delivery: ClaimedDelivery): Promise<Outcome> {
    const notification = await this.prisma.notification.findUniqueOrThrow({
      where: { id: delivery.notification_id },
      select: { id: true, type: true, payload: true, recipientUserId: true, targetType: true, targetId: true },
    });
    if (!isKnownType(notification.type)) return { status: 'SKIPPED', reason: 'type no longer in the catalog' };
    const recipient = await this.members.contact(notification.recipientUserId);
    if (!recipient?.isActive) return { status: 'SKIPPED', reason: 'recipient is not active' };

    const templates = catalogEntry(notification.type).templates[recipient.locale];
    const vars: TemplateVars = {
      ...(notification.payload as TemplateVars),
      full_name: recipient.fullName,
    };

    if (delivery.channel === 'EMAIL') {
      return this.sendEmail(recipient, {
        subject: renderTemplate(templates.emailSubject ?? templates.title, vars),
        text: renderTemplate(templates.emailText ?? templates.body, vars),
      });
    }
    return this.sendPush(recipient, {
      title: renderTemplate(templates.title, vars),
      body: renderTemplate(templates.body, vars),
      data: {
        notification_id: notification.id,
        type: notification.type,
        target_type: notification.targetType ?? '',
        target_id: notification.targetId ?? '',
      },
    });
  }

  private async sendEmail(recipient: MemberContact, content: { subject: string; text: string }): Promise<Outcome> {
    const messageId = await this.email.send({ to: recipient.email, locale: recipient.locale, ...content });
    return {
      status: 'SENT',
      provider: this.email.provider,
      providerMessageId: messageId,
      destinationMasked: maskEmail(recipient.email),
    };
  }

  private async sendPush(
    recipient: MemberContact,
    content: { title: string; body: string; data: Record<string, string> },
  ): Promise<Outcome> {
    const devices = await this.prisma.memberDevice.findMany({
      where: { userId: recipient.id },
      select: { token: true },
    });
    if (devices.length === 0) return { status: 'SKIPPED', reason: 'no registered devices' };

    const results = await this.push.send({ tokens: devices.map((d) => d.token), ...content });
    const unregistered = results.filter((r) => r.outcome === 'UNREGISTERED').map((r) => r.token);
    if (unregistered.length > 0) await this.prisma.memberDevice.deleteMany({ where: { token: { in: unregistered } } });

    const sent = results.filter((r) => r.outcome === 'SENT');
    if (sent.length > 0) {
      return {
        status: 'SENT',
        provider: this.push.provider,
        providerMessageId: sent[0].messageId ?? null,
        destinationMasked: `${sent.length} of ${devices.length} device(s)`,
      };
    }
    const errors = results.filter((r) => r.outcome === 'ERROR');
    if (errors.length === 0) return { status: 'SKIPPED', reason: 'no registered devices' };
    throw new Error(errors[0].error ?? 'push failed');
  }

  private async recordFailure(delivery: ClaimedDelivery, error: unknown): Promise<'retried' | 'failed'> {
    const message = scrubSecrets(error instanceof Error ? error.message : String(error)).slice(0, MAX_ERROR_LENGTH);
    if (delivery.attempts >= MAX_DELIVERY_ATTEMPTS) {
      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: { status: 'FAILED', lastError: message },
      });
      this.logger.error(
        {
          delivery_id: delivery.id,
          channel: delivery.channel,
          attempts: delivery.attempts,
          alert: 'notifications.delivery.failed',
        },
        'Notification delivery failed permanently',
      );
      return 'failed';
    }
    const retryAt = new Date(this.clock.now().getTime() + retryDelaySeconds(delivery.attempts) * 1000);
    await this.prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { nextAttemptAt: retryAt, lastError: message },
    });
    this.logger.warn(
      { delivery_id: delivery.id, channel: delivery.channel, attempts: delivery.attempts },
      'Notification delivery failed; will retry',
    );
    return 'retried';
  }
}
