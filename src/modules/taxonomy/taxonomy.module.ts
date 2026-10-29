import { Module } from '@nestjs/common';
import { TaxonomyService } from './services/taxonomy.service';

/** Taxonomy (database-entities.md §4). Layer L0: depends on audit only. */
@Module({
  providers: [TaxonomyService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}
