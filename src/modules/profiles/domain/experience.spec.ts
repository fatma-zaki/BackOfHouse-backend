import { compareExperience, currentCompany, ExperienceSpan, yearsOfExperience } from './experience';

const job = (start: string, end: string | null, company = 'Co'): ExperienceSpan => ({ company, start, end });
const TODAY = '2026-11-10';

describe('yearsOfExperience', () => {
  it('is 0 without entries or under a year', () => {
    expect(yearsOfExperience([], TODAY)).toBe(0);
    expect(yearsOfExperience([job('2026-01-01', '2026-06-30')], TODAY)).toBe(0);
  });

  it('counts whole years, a current role running to today', () => {
    expect(yearsOfExperience([job('2020-01-01', '2022-12-31')], TODAY)).toBe(3);
    expect(yearsOfExperience([job('2021-11-10', null)], TODAY)).toBe(5);
  });

  it('counts overlapping roles once', () => {
    expect(yearsOfExperience([job('2018-01-01', '2021-12-31'), job('2020-01-01', '2022-12-31')], TODAY)).toBe(5);
    expect(yearsOfExperience([job('2018-01-01', '2023-12-31'), job('2019-01-01', '2019-12-31')], TODAY)).toBe(6);
  });

  it('adds separate roles and joins back-to-back ones', () => {
    expect(yearsOfExperience([job('2010-01-01', '2011-12-31'), job('2015-01-01', '2016-12-31')], TODAY)).toBe(4);
    expect(yearsOfExperience([job('2020-01-01', '2020-12-31'), job('2021-01-01', '2021-12-31')], TODAY)).toBe(2);
  });

  it('ignores time after today', () => {
    expect(yearsOfExperience([job('2025-11-10', '2030-01-01')], TODAY)).toBe(1);
  });
});

describe('profile order and current company', () => {
  const entries = [
    job('2015-03-01', '2018-01-01', 'Old Co'),
    job('2022-05-01', null, 'Main Co'),
    job('2019-02-01', '2022-04-30', 'Mid Co'),
    job('2024-01-01', null, 'Side Co'),
  ];

  it('lists current roles first, then newest start first', () => {
    expect([...entries].sort(compareExperience).map((e) => e.company)).toEqual([
      'Side Co',
      'Main Co',
      'Mid Co',
      'Old Co',
    ]);
  });

  it('takes the most recent current role as the company', () => {
    expect(currentCompany(entries)).toBe('Side Co');
    expect(currentCompany([job('2015-01-01', '2016-01-01')])).toBeNull();
  });
});
