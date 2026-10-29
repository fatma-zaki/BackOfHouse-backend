// Public API of the taxonomy module (nest-module-map.md §2.1 rule 1).
export { TaxonomyModule } from './taxonomy.module';
export {
  TaxonomyService,
  type PublicTaxonomy,
  type PublicTaxonomyItem,
  type TaxonomyItemView,
} from './services/taxonomy.service';
export { FIXED_LISTS, TAXONOMY_KINDS, type TaxonomyKind } from './domain/kinds';
