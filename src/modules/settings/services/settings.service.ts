import { Injectable, Logger } from '@nestjs/common';
import type { Actor } from '../../../common/context/actor';
import { FieldErrors, ValidationFailedError } from '../../../common/errors';
import { AppConfig } from '../../../config/app.config';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner } from '../../../platform/database';
import { AuditLogger, auditActorOf } from '../../audit';
import { defaultSettings, PlatformSettings, SETTING_KEYS, SettingKey, settingsSchema } from '../domain/settings.schema';
import { assertCanManageSettings, assertCanViewSettings } from '../policies/settings.policy';

/** Settings are one entity for audit purposes; this is its fixed id. */
export const PLATFORM_SETTINGS_ENTITY_ID = '00000000-0000-7000-8000-000000000001';

/**
 * Platform settings: defaults in code, overrides in `platform_settings`.
 * `current()` is the internal read for other modules and the app surface;
 * the staff methods check the policy themselves, whoever calls them.
 */
@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly config: AppConfig,
  ) {}

  /** Effective settings. A stored value that no longer validates falls back to its default. */
  async current(): Promise<PlatformSettings> {
    const rows = await this.prisma.platformSetting.findMany();
    return this.merge(rows);
  }

  async getForStaff(actor: Actor | undefined): Promise<PlatformSettings> {
    assertCanViewSettings(actor);
    return this.current();
  }

  /**
   * Replaces the settings (PUT). Only keys whose value changed are written, and the
   * change is audited as `settings.update` in the same transaction (ADR-016).
   */
  async update(actor: Actor | undefined, input: unknown): Promise<PlatformSettings> {
    assertCanManageSettings(actor);

    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path.join('.') || '(body)';
        (errors[field] ??= []).push(issue.message);
      }
      throw new ValidationFailedError(errors);
    }
    const next = parsed.data;
    // The staff email domain is a security boundary (ADR-032): it comes from
    // STAFF_GOOGLE_WORKSPACE_DOMAIN and cannot be widened from the admin UI.
    if (next.admin_email_domain !== this.workspaceDomain()) {
      throw new ValidationFailedError({
        admin_email_domain: ['is set by STAFF_GOOGLE_WORKSPACE_DOMAIN and cannot be changed here (ADR-032)'],
      });
    }

    return this.transactions.run(async (tx) => {
      const before = this.merge(await tx.platformSetting.findMany());
      const changed = SETTING_KEYS.filter(
        (key) => key !== 'admin_email_domain' && JSON.stringify(before[key]) !== JSON.stringify(next[key]),
      );

      for (const key of changed) {
        const value = next[key] as Prisma.InputJsonValue;
        await tx.platformSetting.upsert({
          where: { key },
          create: { key, value, updatedByStaffId: actor.staffId },
          update: { value, updatedByStaffId: actor.staffId },
        });
      }

      await this.audit.record({
        actor: auditActorOf(actor),
        action: 'settings.update',
        entityType: 'platform_settings',
        entityId: PLATFORM_SETTINGS_ENTITY_ID,
        changes: {
          before: Object.fromEntries(changed.map((key) => [key, before[key]])),
          after: Object.fromEntries(changed.map((key) => [key, next[key]])),
        },
      });

      return next;
    });
  }

  private merge(rows: { key: string; value: Prisma.JsonValue }[]): PlatformSettings {
    const settings: Record<string, unknown> = { ...defaultSettings(this.appVersionDefaults()) };
    for (const row of rows) {
      if (!(SETTING_KEYS as string[]).includes(row.key)) {
        continue;
      }
      const field = settingsSchema.shape[row.key as SettingKey];
      const parsed = field.safeParse(row.value);
      if (parsed.success) {
        settings[row.key] = parsed.data;
      } else {
        this.logger.warn(`Stored setting "${row.key}" is invalid; using the default`);
      }
    }
    settings.admin_email_domain = this.workspaceDomain();
    return settings as PlatformSettings;
  }

  private workspaceDomain(): string {
    return this.config.staffAuth.workspaceDomain?.toLowerCase() ?? '';
  }

  private appVersionDefaults(): PlatformSettings['app_version'] {
    const { IOS, ANDROID } = this.config.appVersion;
    const toPolicy = (p: typeof IOS) => ({
      min_supported_version: p.minSupportedVersion,
      latest_version: p.latestVersion,
      update_url: p.updateUrl,
    });
    return { ios: toPolicy(IOS), android: toPolicy(ANDROID) };
  }
}
