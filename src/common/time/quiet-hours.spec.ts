import { outsideQuietHours, quietHoursEnd } from './quiet-hours';

/** A Riyadh wall-clock time on 2026-11-06 (UTC+3) as an instant. */
const riyadh = (hhmm: string, day = 6) => new Date(`2026-11-${String(day).padStart(2, '0')}T${hhmm}:00+03:00`);

describe('quietHoursEnd', () => {
  const overnight = { start: '23:00', end: '08:00' };

  it.each([
    ['23:00', riyadh('08:00', 7)],
    ['23:59', riyadh('08:00', 7)],
    ['00:00', riyadh('08:00')],
    ['03:30', riyadh('08:00')],
    ['07:59', riyadh('08:00')],
  ])('holds a push at %s until 08:00 (window across midnight)', (time, expected) => {
    expect(quietHoursEnd(riyadh(time), overnight)).toEqual(expected);
  });

  it.each(['08:00', '12:00', '22:59'])('lets a push at %s through', (time) => {
    expect(quietHoursEnd(riyadh(time), overnight)).toBeNull();
  });

  it('handles a window inside one day', () => {
    const afternoon = { start: '13:00', end: '15:30' };
    expect(quietHoursEnd(riyadh('14:00'), afternoon)).toEqual(riyadh('15:30'));
    expect(quietHoursEnd(riyadh('12:59'), afternoon)).toBeNull();
    expect(quietHoursEnd(riyadh('15:30'), afternoon)).toBeNull();
  });

  it('uses Riyadh time, not UTC (21:30 UTC is 00:30 in Riyadh)', () => {
    expect(quietHoursEnd(new Date('2026-11-06T21:30:00Z'), overnight)).toEqual(riyadh('08:00', 7));
  });

  it('treats equal start and end as no quiet hours', () => {
    expect(quietHoursEnd(riyadh('03:00'), { start: '00:00', end: '00:00' })).toBeNull();
  });

  it('refuses malformed times', () => {
    expect(() => quietHoursEnd(riyadh('03:00'), { start: '24:00', end: '08:00' })).toThrow(/HH:MM/);
  });

  it('outsideQuietHours returns the time itself outside the window', () => {
    expect(outsideQuietHours(riyadh('12:00'), overnight)).toEqual(riyadh('12:00'));
    expect(outsideQuietHours(riyadh('02:00'), overnight)).toEqual(riyadh('08:00'));
  });
});
