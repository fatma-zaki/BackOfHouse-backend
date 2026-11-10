import { Module } from '@nestjs/common';
import { AppConfig } from '../../config/app.config';
import { DevMalwareScanner, MALWARE_SCANNER, MalwareScanner, NotConfiguredMalwareScanner } from './malware-scanner';

/**
 * Provides MALWARE_SCANNER. Until TQ-10 chooses a scanner, local and test use the dev
 * scanner (EICAR only) and every other environment refuses uploads with 503.
 */
@Module({
  providers: [
    {
      provide: MALWARE_SCANNER,
      inject: [AppConfig],
      useFactory: (config: AppConfig): MalwareScanner =>
        config.app.appEnv === 'local' || config.app.appEnv === 'test'
          ? new DevMalwareScanner()
          : new NotConfiguredMalwareScanner(),
    },
  ],
  exports: [MALWARE_SCANNER],
})
export class ScanningModule {}
