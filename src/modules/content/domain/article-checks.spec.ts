import { articleSlug, intrinsicChecks, translationGaps } from './article-checks';

const complete = {
  topic: 'REGULATORY',
  en: { headline: 'New rigging rules', excerpt: null, body: '<p>From March.</p>' },
  ar: { headline: 'قواعد جديدة', excerpt: null, body: '<p>من مارس.</p>' },
};

describe('translationGaps', () => {
  it('is empty for a complete article', () => {
    expect(translationGaps(complete)).toEqual({});
  });

  it('names every missing field, and a body of empty markup counts as missing', () => {
    expect(
      translationGaps({
        topic: null,
        en: complete.en,
        ar: { headline: '  ', excerpt: null, body: '<p> </p>' },
      }),
    ).toEqual({
      'ar.headline': ['is required to publish'],
      'ar.body': ['is required to publish'],
      category: ['is required to publish'],
    });
  });
});

describe('intrinsicChecks', () => {
  const base = { ...complete, hasCover: false, coverAlt: { en: null, ar: null } };

  it('passes a complete article without a cover', () => {
    expect(intrinsicChecks(base).map((c) => [c.key, c.result])).toEqual([
      ['BOTH_LANGUAGES', 'PASS'],
      ['COVER_ALT', 'PASS'],
      ['HEADLINE_LENGTH', 'PASS'],
    ]);
  });

  it('fails a missing language and a cover without alt text, and warns on long headlines', () => {
    const checks = intrinsicChecks({
      ...base,
      ar: { headline: null, excerpt: null, body: null },
      en: { ...base.en, headline: 'x'.repeat(71) },
      hasCover: true,
      coverAlt: { en: 'Stage', ar: null },
    });
    expect(checks.map((c) => [c.key, c.result])).toEqual([
      ['BOTH_LANGUAGES', 'FAIL'],
      ['COVER_ALT', 'FAIL'],
      ['HEADLINE_LENGTH', 'WARN'],
    ]);
  });
});

describe('articleSlug', () => {
  it('uses the Latin headline and the id prefix', () => {
    expect(articleSlug('GEA: New Rigging Rules!', '0191f0a0-aaaa-7000-8000-000000000001')).toBe(
      'gea-new-rigging-rules-0191f0a0',
    );
    expect(articleSlug('قواعد جديدة', '0191f0a0-aaaa-7000-8000-000000000001')).toBe('article-0191f0a0');
    expect(articleSlug(null, '0191F0A0-aaaa')).toBe('article-0191f0a0');
  });
});
