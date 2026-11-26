import { appAgendaSlot, fromAdminType, pointsStatus, registrationRefusal, toAdminType } from './event-rules';

describe('event rules', () => {
  const now = new Date('2026-12-01T10:00:00Z');
  const later = new Date('2026-12-02T10:00:00Z');

  it('opens registration while the event is published and not over, within capacity', () => {
    expect(registrationRefusal({ status: 'PUBLISHED', endsAt: later, capacity: null }, 999, now)).toBeNull();
    expect(registrationRefusal({ status: 'PUBLISHED', endsAt: later, capacity: 2 }, 1, now)).toBeNull();
    expect(registrationRefusal({ status: 'PUBLISHED', endsAt: later, capacity: 2 }, 2, now)).toBe('EVENT_FULL');
    expect(registrationRefusal({ status: 'PUBLISHED', endsAt: now, capacity: null }, 0, now)).toBe('CLOSED');
    for (const status of ['DRAFT', 'CANCELLED', 'COMPLETED'] as const) {
      expect(registrationRefusal({ status, endsAt: later, capacity: null }, 0, now)).toBe('CLOSED');
    }
  });

  it('tracks where the attendance points stand', () => {
    expect(pointsStatus(later, now, 0, 0)).toBe('UPCOMING');
    expect(pointsStatus(now, now, 0, 0)).toBe('AWAITING_CHECK_INS');
    expect(pointsStatus(now, later, 3, 0)).toBe('PARTLY_AWARDED');
    expect(pointsStatus(now, later, 3, 2)).toBe('PARTLY_AWARDED');
    expect(pointsStatus(now, later, 3, 3)).toBe('AWARDED');
  });

  it('stores the admin EXHIBITION as EXPO and shows it back', () => {
    expect(fromAdminType('EXHIBITION')).toBe('EXPO');
    expect(toAdminType('EXPO')).toBe('EXHIBITION');
    expect(fromAdminType('CONCERT')).toBe('CONCERT');
  });

  it('numbers agenda days from the first day, in Riyadh time', () => {
    const item = { day: '2026-12-03', time: '18:30', title: { en: 'Keynote', ar: 'الكلمة' }, location: 'Hall A' };
    expect(appAgendaSlot(item, '2026-12-02')).toEqual({ day: 2, at: new Date('2026-12-03T15:30:00Z') });
    expect(appAgendaSlot({ ...item, day: '2026-12-02' }, '2026-12-02').day).toBe(1);
  });
});
