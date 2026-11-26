// Public API of the events module (nest-module-map.md §2.1 rule 1).
export { EventsModule } from './events.module';
export {
  EventsService,
  type AttendanceSummaryView,
  type EventAdminView,
  type EventView,
  type RegistrationView,
  type SpeakerInput,
} from './services/events.service';
export {
  ADMIN_EVENT_TYPES,
  appAgendaSlot,
  EVENT_TYPES,
  toAdminType,
  type AgendaInput,
  type EventType,
} from './domain/event-rules';
