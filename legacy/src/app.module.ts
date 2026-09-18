import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { EventsModule } from './events/events.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { NewsModule } from './news/news.module';
import { CoursesModule } from './courses/courses.module';
import { PointsModule } from './points/points.module';
import { RewardsModule } from './rewards/rewards.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FilesModule } from './files/files.module';
import { HealthModule } from './health/health.module';
import { AppConfig, configuration, getAppConfig } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const { rateLimit } = getAppConfig((key) => configService.get<AppConfig>(key));
        return { throttlers: [{ ttl: rateLimit.ttlMs, limit: rateLimit.limit }] };
      },
    }),
    DatabaseModule,
    AuditModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    ProfessionalsModule,
    EventsModule,
    OpportunitiesModule,
    NewsModule,
    CoursesModule,
    PointsModule,
    RewardsModule,
    NotificationsModule,
    FilesModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformResponseInterceptor },
  ],
})
export class AppModule {}
