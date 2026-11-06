import type { CatalogEntry } from './catalog';
import { planDeliveries, retryDelaySeconds } from './delivery-plan';

const entry = (overrides: Partial<CatalogEntry> = {}): CatalogEntry => ({
  type: 'test.thing_happened',
  category: 'NEWS',
  channels: ['PUSH', 'EMAIL'],
  mandatory: false,
  respectsQuietHours: true,
  variables: [],
  templates: { en: { title: 't', body: 'b' }, ar: { title: 't', body: 'b' } },
  ...overrides,
});

const quietHours = { start: '23:00', end: '08:00' };
const night = new Date('2026-11-06T02:00:00+03:00');
const morning = new Date('2026-11-06T08:00:00+03:00');
const noon = new Date('2026-11-06T12:00:00+03:00');

describe('planDeliveries', () => {
  it('queues every channel now outside quiet hours', () => {
    expect(planDeliveries(entry(), { disabled: new Set(), now: noon, quietHours })).toEqual([
      { channel: 'PUSH', status: 'QUEUED', nextAttemptAt: noon, lastError: null },
      { channel: 'EMAIL', status: 'QUEUED', nextAttemptAt: noon, lastError: null },
    ]);
  });

  it('holds push, not email, until quiet hours end', () => {
    const plan = planDeliveries(entry(), { disabled: new Set(), now: night, quietHours });
    expect(plan.map((p) => [p.channel, p.nextAttemptAt])).toEqual([
      ['PUSH', morning],
      ['EMAIL', night],
    ]);
  });

  it('sends alerts that ignore quiet hours at once', () => {
    const plan = planDeliveries(entry({ respectsQuietHours: false }), { disabled: new Set(), now: night, quietHours });
    expect(plan[0].nextAttemptAt).toEqual(night);
  });

  it('skips channels the member turned off', () => {
    const plan = planDeliveries(entry(), { disabled: new Set(['EMAIL']), now: noon, quietHours });
    expect(plan[1]).toEqual({
      channel: 'EMAIL',
      status: 'SKIPPED',
      nextAttemptAt: noon,
      lastError: 'turned off by the member',
    });
  });

  it('ignores preferences for mandatory types', () => {
    const plan = planDeliveries(entry({ mandatory: true }), {
      disabled: new Set(['PUSH', 'EMAIL']),
      now: noon,
      quietHours,
    });
    expect(plan.every((p) => p.status === 'QUEUED')).toBe(true);
  });
});

describe('retryDelaySeconds', () => {
  it('doubles from 30 seconds up to an hour', () => {
    expect([1, 2, 3, 4, 10, 20].map(retryDelaySeconds)).toEqual([30, 60, 120, 240, 3600, 3600]);
  });
});
