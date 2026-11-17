import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { JobsModule } from '../../platform/jobs/jobs.module';
import { JobsService } from '../../platform/jobs/jobs.service';
import { IdentityModule } from '../identity';
import { ProfilesModule } from '../profiles';
import { TaxonomyModule } from '../taxonomy';
import { ArticlesService } from './services/articles.service';
import { NewsService } from './services/news.service';

/** Every minute: scheduled articles whose time has come go live. */
const PUBLISH_CRON = '* * * * *';

/**
 * Content (nest-module-map.md §4.10): editorial articles and members' likes, saves and
 * comments. Depends on identity and profiles for the comment author snapshot and on
 * taxonomy for topic labels. Checks that need companies are composed in the back office.
 */
@Module({
  imports: [JobsModule, IdentityModule, ProfilesModule, TaxonomyModule],
  providers: [ArticlesService, NewsService],
  exports: [ArticlesService, NewsService],
})
export class ContentModule implements OnModuleInit {
  private readonly logger = new Logger(ContentModule.name);

  constructor(
    private readonly jobs: JobsService,
    private readonly articles: ArticlesService,
  ) {}

  onModuleInit(): void {
    this.jobs.defineCron('article.publish', PUBLISH_CRON, async () => {
      const released = await this.articles.releaseDue();
      if (released > 0) this.logger.log({ released }, 'Published scheduled articles');
    });
  }
}
