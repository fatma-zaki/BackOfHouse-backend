import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { FIXED_LISTS, isTaxonomyKind, slugify, uniqueSlug } from './kinds';

describe('taxonomy kinds', () => {
  it('uses exactly the enum values of the app contract for the fixed lists', () => {
    const contract = yaml.load(readFileSync(join(__dirname, '../../../../contracts/app/openapi.yaml'), 'utf8')) as {
      components: { schemas: Record<string, { enum: string[] }> };
    };
    const enumOf = (name: string) => [...contract.components.schemas[name].enum].sort();
    const codes = (kind: keyof typeof FIXED_LISTS) => FIXED_LISTS[kind].map((i) => i.code).sort();
    expect(codes('company_types')).toEqual(enumOf('CompanyType'));
    expect(codes('opportunity_types')).toEqual(enumOf('OpportunityType'));
    expect(codes('news_topics')).toEqual(enumOf('NewsTopic'));
  });

  it('has both languages for every default label', () => {
    for (const list of Object.values(FIXED_LISTS)) {
      for (const item of list) {
        expect(item.name.en.trim()).not.toBe('');
        expect(item.name.ar.trim()).not.toBe('');
      }
    }
  });

  it('recognises only the six kinds', () => {
    expect(
      ['cities', 'crafts', 'industries', 'company_types', 'opportunity_types', 'news_topics'].every(isTaxonomyKind),
    ).toBe(true);
    expect(isTaxonomyKind('listing_types')).toBe(false);
    expect(isTaxonomyKind('__proto__')).toBe(false);
  });

  it.each([
    ['Stage Manager', 'stage-manager'],
    ['  Lighting & Sound  ', 'lighting-sound'],
    ['Café Crème', 'cafe-creme'],
    ['مدير مسرح', ''],
  ])('slugify(%s) → %s', (name, slug) => {
    expect(slugify(name)).toBe(slug);
  });

  it('finds the first free slug', () => {
    expect(uniqueSlug('riyadh', new Set())).toBe('riyadh');
    expect(uniqueSlug('riyadh', new Set(['riyadh', 'riyadh-2']))).toBe('riyadh-3');
    expect(uniqueSlug('', new Set())).toBe('item');
  });
});
