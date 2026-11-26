/**
 * Event rules that need no database (execution-plan Phase 6, BQ-77). Registering earns
 * nothing; points come from attendance verified at the door.
 */

export const EVENT_TYPES = ['CONFERENCE', 'WORKSHOP', 'NETWORKING', 'EXPO', 'CONCERT', 'FESTIVAL', 'MEETUP'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** contracts/admin `Event.type` names EXPO "EXHIBITION". */
export const ADMIN_EVENT_TYPES = [
  'CONFERENCE',
  'EXHIBITION',
  'WORKSHOP',
  'NETWORKING',
  'CONCERT',
  'FESTIVAL',
  'MEETUP',
] as const;
export type AdminEventType = (typeof ADMIN_EVENT_TYPES)[number];

export const fromAdminType = (type: AdminEventType): EventType => (type === 'EXHIBITION' ? 'EXPO' : type);
export const toAdminType = (type: EventType): AdminEventType => (type === 'EXPO' ? 'EXHIBITION' : type);

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

/**
 * Why a member cannot register now, or null. Registration is open while the event is
 * PUBLISHED and has not ended; `taken` counts active registrations against `capacity`.
 */
export function registrationRefusal(
  event: { status: EventStatus; endsAt: Date; capacity: number | null },
  taken: number,
  now: Date,
): 'CLOSED' | 'EVENT_FULL' | null {
  if (event.status !== 'PUBLISHED' || event.endsAt <= now) return 'CLOSED';
  if (event.capacity !== null && taken >= event.capacity) return 'EVENT_FULL';
  return null;
}

/** contracts/admin `EventAdmin.points_status`. */
export function pointsStatus(
  startsAt: Date,
  now: Date,
  verified: number,
  awarded: number,
): 'UPCOMING' | 'AWAITING_CHECK_INS' | 'PARTLY_AWARDED' | 'AWARDED' {
  if (now < startsAt) return 'UPCOMING';
  if (verified === 0) return 'AWAITING_CHECK_INS';
  return awarded < verified ? 'PARTLY_AWARDED' : 'AWARDED';
}

/** An agenda item as staff enter it (contracts/admin `EventInput.agenda`). */
export interface AgendaInput {
  day: string;
  time: string;
  title: { en: string; ar: string };
  location: string;
}

/**
 * contracts/app `AgendaItem` from an admin item: `day` counts from the event's first
 * Riyadh day (1-based); the slot has a start time only, so it starts and ends at that time.
 */
export function appAgendaSlot(item: AgendaInput, firstDay: string): { day: number; at: Date } {
  const day = Math.round((Date.parse(`${item.day}T00:00:00Z`) - Date.parse(`${firstDay}T00:00:00Z`)) / 86_400_000) + 1;
  return { day: Math.max(1, day), at: new Date(`${item.day}T${item.time}:00+03:00`) };
}
