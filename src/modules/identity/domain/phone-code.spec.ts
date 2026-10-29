import { normalizePhone, riyadhDay } from './phone-code';

describe('phone codes', () => {
  it.each([
    ['+966501234567', '+966501234567'],
    [' +966 50 123 4567 ', '+966501234567'],
    ['00966-50-123-4567', '+966501234567'],
    ['+٩٦٦٥٠١٢٣٤٥٦٧', '+966501234567'],
    ['+(966) 50.123.4567', '+966501234567'],
  ])('normalises %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(['0501234567', '+0966501234567', '+96650', 'phone', '+9665012345678901', ''])('refuses %s', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });

  it('computes the Riyadh day (UTC+3)', () => {
    expect(riyadhDay(new Date('2026-10-29T20:59:59Z'))).toBe('2026-10-29');
    expect(riyadhDay(new Date('2026-10-29T21:00:00Z'))).toBe('2026-10-30');
  });
});
