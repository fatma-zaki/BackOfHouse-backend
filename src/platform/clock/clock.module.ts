import { Global, Module } from '@nestjs/common';
import { CLOCK, SystemClock } from '../../common/clock/clock';

/** Provides CLOCK (the system clock); tests override it to move time. */
@Global()
@Module({
  providers: [{ provide: CLOCK, useClass: SystemClock }],
  exports: [CLOCK],
})
export class ClockModule {}
