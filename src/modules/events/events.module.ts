import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { JobsModule } from '../../platform/jobs/jobs.module';
import { JobsService } from '../../platform/jobs/jobs.service';
import { CompaniesModule } from '../companies';
import { EngagementModule } from '../engagement';
import { EventsService } from './services/events.service';

/**
 * Events (nest-module-map.md §4.20, layer L7): events, registrations with a QR pass,
 * check-ins and attendance points (through engagement). Jobs: `event.reminder` (every 15
 * min, once per event within 24 h of the start) and `event.complete` (every 15 min).
 */
@Module({
  imports: [JobsModule, CompaniesModule, EngagementModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule implements OnModuleInit {
  private readonly logger = new Logger(EventsModule.name);

  constructor(
    private readonly jobs: JobsService,
    private readonly events: EventsService,
  ) {}

  onModuleInit(): void {
    this.jobs.defineCron('event.reminder', '*/15 * * * *', async () => {
      const reminded = await this.events.remind();
      if (reminded > 0) this.logger.log({ reminded }, 'Sent event reminders');
    });
    this.jobs.defineCron('event.complete', '*/15 * * * *', async () => {
      const completed = await this.events.complete();
      if (completed > 0) this.logger.log({ completed }, 'Completed events past their end');
    });
  }
}
