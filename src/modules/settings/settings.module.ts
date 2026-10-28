import { Module } from '@nestjs/common';
import { SettingsService } from './services/settings.service';

/** Platform settings (execution-plan.md Phase 1). Layer L0: no domain dependencies besides audit and access. */
@Module({
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
