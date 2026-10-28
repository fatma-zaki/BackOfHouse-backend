import { z } from 'zod';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be HH:MM (24 h, Asia/Riyadh)');
const semver = z.string().regex(/^\d+\.\d+\.\d+$/, 'must be a version like 1.2.3');

function compareVersions(a: string, b: string): number {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  for (let i = 0; i < 3; i += 1) {
    if (x[i] !== y[i]) return x[i] - y[i];
  }
  return 0;
}

const appVersionPolicy = z
  .object({
    min_supported_version: semver,
    latest_version: semver,
    update_url: z.string().url(),
  })
  .strict()
  .refine((p) => compareVersions(p.min_supported_version, p.latest_version) <= 0, {
    message: 'min_supported_version must not be above latest_version',
    path: ['min_supported_version'],
  });

const levels = z
  .array(z.object({ level: z.number().int().min(1), min_lifetime_points: z.number().int().min(0) }).strict())
  .min(1)
  .refine((list) => list.every((l, i) => l.level === i + 1), { message: 'levels must be numbered 1, 2, 3 … in order' })
  .refine((list) => list[0]?.min_lifetime_points === 0, { message: 'level 1 must start at 0 points' })
  .refine((list) => list.every((l, i) => i === 0 || l.min_lifetime_points > list[i - 1].min_lifetime_points), {
    message: 'each level must need more lifetime points than the one before',
  });

/**
 * Platform settings (contracts/admin `PlatformSettings`). Every key has a default
 * in code; the database stores overrides. Rules decided by the product owner are
 * part of the schema, so no screen or script can switch them off:
 *   - every opportunity is reviewed, and verified companies never skip review (D9);
 *   - levels are lifetime earned points (BQ-76), starting at L1 = 0.
 */
export const settingsSchema = z
  .object({
    review_sla_hours: z.number().int().min(1).max(168),
    review_every_opportunity: z.literal(true, { message: 'every opportunity is reviewed (D9)' }),
    hide_contact_details_in_opportunities: z.boolean(),
    auto_flag_fee_opportunities: z.boolean(),
    verified_companies_skip_review: z.literal(false, { message: 'verified companies do not skip review (D9)' }),
    support_first_reply_hours: z.number().int().min(1).max(72),
    support_points_monthly_cap: z.number().int().min(0).max(100_000),
    admin_email_domain: z
      .string()
      .max(253)
      .regex(
        /^$|^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/,
        'must be a domain like example.com',
      ),
    admin_idle_timeout_minutes: z.number().int().min(5).max(120),
    push_quiet_hours: z.object({ start: hhmm, end: hhmm }).strict(),
    levels,
    app_version: z.object({ ios: appVersionPolicy, android: appVersionPolicy }).strict(),
  })
  .strict();

export type PlatformSettings = z.infer<typeof settingsSchema>;
export type SettingKey = keyof PlatformSettings;
export const SETTING_KEYS = Object.keys(settingsSchema.shape) as SettingKey[];

export interface AppVersionDefaults {
  ios: PlatformSettings['app_version']['ios'];
  android: PlatformSettings['app_version']['android'];
}

/**
 * Defaults: hand-off doc 01 values with the decisions of 2026-10-11 (D9, BQ-77).
 * App-version defaults come from the environment until a Super admin sets them.
 */
export function defaultSettings(appVersion: AppVersionDefaults): PlatformSettings {
  return {
    review_sla_hours: 24,
    review_every_opportunity: true,
    hide_contact_details_in_opportunities: true,
    auto_flag_fee_opportunities: true,
    verified_companies_skip_review: false,
    support_first_reply_hours: 4,
    support_points_monthly_cap: 500,
    admin_email_domain: '',
    admin_idle_timeout_minutes: 30,
    push_quiet_hours: { start: '23:00', end: '08:00' },
    levels: [
      { level: 1, min_lifetime_points: 0 },
      { level: 2, min_lifetime_points: 100 },
      { level: 3, min_lifetime_points: 500 },
      { level: 4, min_lifetime_points: 1500 },
    ],
    app_version: appVersion,
  };
}
