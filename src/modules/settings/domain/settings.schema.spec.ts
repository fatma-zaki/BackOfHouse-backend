import { defaultSettings, settingsSchema } from './settings.schema';

const policy = { min_supported_version: '1.0.0', latest_version: '1.2.0', update_url: 'https://apps.apple.com/' };
const defaults = defaultSettings({ ios: policy, android: policy });

const withChange = (patch: Record<string, unknown>) => ({ ...defaults, ...patch });
const issues = (input: unknown) => {
  const result = settingsSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};

describe('settings schema', () => {
  it('accepts the defaults (D9, BQ-77 values)', () => {
    expect(issues(defaults)).toEqual([]);
    expect(defaults.levels.map((l) => l.min_lifetime_points)).toEqual([0, 100, 500, 1500]);
    expect(defaults).toMatchObject({
      support_first_reply_hours: 4,
      support_points_monthly_cap: 500,
      review_sla_hours: 24,
    });
  });

  it('refuses switching off review for everyone or for verified companies (D9)', () => {
    expect(issues(withChange({ review_every_opportunity: false }))).toEqual([
      'review_every_opportunity: every opportunity is reviewed (D9)',
    ]);
    expect(issues(withChange({ verified_companies_skip_review: true }))).toEqual([
      'verified_companies_skip_review: verified companies do not skip review (D9)',
    ]);
  });

  it.each([
    [[{ level: 1, min_lifetime_points: 10 }], 'level 1 must start at 0 points'],
    [
      [
        { level: 1, min_lifetime_points: 0 },
        { level: 3, min_lifetime_points: 100 },
      ],
      'levels must be numbered 1, 2, 3 … in order',
    ],
    [
      [
        { level: 1, min_lifetime_points: 0 },
        { level: 2, min_lifetime_points: 0 },
      ],
      'each level must need more lifetime points than the one before',
    ],
  ])('refuses invalid levels %#', (levels, message) => {
    expect(issues(withChange({ levels }))).toEqual([`levels: ${message}`]);
  });

  it('refuses bad quiet hours, versions and unknown keys', () => {
    expect(issues(withChange({ push_quiet_hours: { start: '24:00', end: '08:00' } }))).toEqual([
      'push_quiet_hours.start: must be HH:MM (24 h, Asia/Riyadh)',
    ]);
    expect(
      issues(withChange({ app_version: { ios: { ...policy, min_supported_version: '2.0.0' }, android: policy } })),
    ).toEqual(['app_version.ios.min_supported_version: min_supported_version must not be above latest_version']);
    expect(issues(withChange({ surprise: true }))).toHaveLength(1);
  });
});
