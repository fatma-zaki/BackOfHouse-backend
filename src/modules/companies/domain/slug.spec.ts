import { companySlug } from './slug';

const ID = '0192f7a1-0000-7000-8000-000000000001';

describe('companySlug', () => {
  it('keeps Latin letters and digits, joined by dashes, plus the id prefix', () => {
    expect(companySlug('Stagecraft Co.', ID)).toBe('stagecraft-co-0192f7a1');
    expect(companySlug('  MDL Beast — 2026!! ', ID)).toBe('mdl-beast-2026-0192f7a1');
  });

  it('falls back to "company" for names without Latin letters', () => {
    expect(companySlug('أرامكو السعودية', ID)).toBe('company-0192f7a1');
  });

  it('matches the slug format the database checks', () => {
    for (const name of ['A', 'سابك Sabic', '---', 'x_y']) {
      expect(companySlug(name, ID)).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
});
