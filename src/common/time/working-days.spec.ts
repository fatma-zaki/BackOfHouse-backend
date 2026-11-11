import { addWorkingDays } from './working-days';

/** A Riyadh wall-clock time in November 2026 (UTC+3). 2026-11-08 is a Sunday. */
const riyadh = (day: number, hhmm = '10:00') => new Date(`2026-11-${String(day).padStart(2, '0')}T${hhmm}:00+03:00`);

describe('addWorkingDays (Sunday to Thursday)', () => {
  it.each([
    ['Sunday', 8, 11],
    ['Monday', 9, 12],
    ['Tuesday', 10, 15],
    ['Wednesday', 11, 16],
    ['Thursday', 12, 17],
  ])('3 working days from %s 10:00', (_, from, to) => {
    expect(addWorkingDays(riyadh(from), 3)).toEqual(riyadh(to));
  });

  it('starts a weekend submission on Sunday 00:00', () => {
    expect(addWorkingDays(riyadh(13, '15:30'), 3)).toEqual(riyadh(18, '00:00'));
    expect(addWorkingDays(riyadh(14, '23:00'), 1)).toEqual(riyadh(16, '00:00'));
  });

  it('uses Riyadh days, not UTC (Thursday 22:30 UTC is Friday in Riyadh)', () => {
    expect(addWorkingDays(new Date('2026-11-12T22:30:00Z'), 1)).toEqual(riyadh(16, '00:00'));
  });

  it('adds nothing for 0 days on a working day', () => {
    expect(addWorkingDays(riyadh(9), 0)).toEqual(riyadh(9));
  });
});
