import { hasContactDetails, hasFeeLanguage, mentionsHours, runChecks, slaState } from './opportunity-checks';
import { OpportunityContent, submitGaps } from './opportunity-type.policy';

const job: OpportunityContent = {
  type: 'JOB',
  title: 'Rigging lead',
  city: 'Riyadh',
  summary: 'Lead the rigging crew',
  description: 'Shifts of 10 hours, Sunday to Thursday.',
  employmentType: 'FULL_TIME',
  compensation: 'SAR 12k / mo',
  duration: null,
  responsibilities: [],
  requirements: [],
  skills: [],
  supplierTypes: [],
  closesAt: null,
  workSetup: 'ON_SITE',
};
const settings = { hideContactDetails: true, autoFlagFees: true };
const results = (content: OpportunityContent, verified = true, s = settings) =>
  Object.fromEntries(runChecks(content, { verified }, s).checks.map((c) => [c.key, c.result]));

describe('contact details', () => {
  it.each([
    ['write to jobs@stage.sa', true],
    ['call +966 55 123 4567', true],
    ['call ٠٥٥١٢٣٤٥٦٧', true],
    ['see https://stage.sa/jobs', true],
    ['see www.stage.sa', true],
    ['DM @stage_crew', true],
    ['crew of 12, 3 shifts, 2026 season, SAR 12,000', false],
  ])('%s → %s', (text, found) => {
    expect(hasContactDetails(text.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660)))).toBe(found);
  });
});

describe('fee language and hours', () => {
  it.each([
    ['A registration fee of SAR 200 applies', true],
    ['Pay a fee before the interview', true],
    ['refundable deposit', true],
    ['يتم دفع رسوم التسجيل', true],
    ['مبلغ تأمين مسترد', true],
    ['خبرة في الرسوم المتحركة', false],
    ['Fees are covered by us? No: we cover travel', false],
  ])('fee: %s → %s', (text, found) => {
    expect(hasFeeLanguage(text)).toBe(found);
  });

  it.each([
    ['9am to 5pm', true],
    ['Shifts of 10 hours', true],
    ['دوام كامل', true],
    ['A great team', false],
  ])('hours: %s → %s', (text, found) => {
    expect(mentionsHours(text)).toBe(found);
  });
});

describe('runChecks', () => {
  it('passes a complete listing from a verified company', () => {
    expect(results(job)).toEqual({
      COMPANY_VERIFIED: 'PASS',
      NO_CONTACT_DETAILS: 'PASS',
      WORKING_HOURS_PRESENT: 'PASS',
      PAY_PRESENT: 'PASS',
      NO_FEE_LANGUAGE: 'PASS',
    });
  });

  it('warns on an unverified company, missing hours and missing pay', () => {
    expect(results({ ...job, description: 'A great team', compensation: null }, false)).toMatchObject({
      COMPANY_VERIFIED: 'WARN',
      WORKING_HOURS_PRESENT: 'WARN',
      PAY_PRESENT: 'WARN',
    });
  });

  it('fails and flags contact details and fees, or only warns when the settings are off', () => {
    const risky = { ...job, description: 'Shifts of 8 hours. Pay a fee of SAR 100 and email hr@stage.sa' };
    const flagged = runChecks(risky, { verified: true }, settings);
    expect(flagged.flags).toEqual(['SPAM', 'SCAM']);
    expect(results(risky)).toMatchObject({ NO_CONTACT_DETAILS: 'FAIL', NO_FEE_LANGUAGE: 'FAIL' });

    const off = { hideContactDetails: false, autoFlagFees: false };
    expect(runChecks(risky, { verified: true }, off).flags).toEqual([]);
    expect(results(risky, true, off)).toMatchObject({ NO_CONTACT_DETAILS: 'WARN', NO_FEE_LANGUAGE: 'WARN' });
  });

  it('does not ask a supplier request or volunteering for hours or pay', () => {
    const request = { ...job, type: 'SUPPLIER_REQUEST' as const, description: 'Need LED walls', compensation: null };
    expect(results(request)).toMatchObject({ WORKING_HOURS_PRESENT: 'PASS', PAY_PRESENT: 'PASS' });
    expect(results({ ...job, type: 'VOLUNTEERING', compensation: null })).toMatchObject({ PAY_PRESENT: 'PASS' });
  });
});

describe('submitGaps', () => {
  const now = new Date('2026-11-20T10:00:00Z');

  it('is empty for a complete listing', () => {
    expect(submitGaps(job, now)).toEqual({});
  });

  it('names what is missing, by type', () => {
    expect(
      submitGaps({ ...job, title: ' ', summary: '', employmentType: null, closesAt: new Date('2026-11-19') }, now),
    ).toEqual({
      title: ['is required to submit'],
      summary: ['is required to submit'],
      employment_type: ['is required to submit'],
      closes_at: ['must be in the future'],
    });
    expect(submitGaps({ ...job, type: 'SUPPLIER_REQUEST', employmentType: null }, now)).toEqual({
      supplier_types: ['needs at least one company type'],
    });
  });
});

describe('slaState', () => {
  const submitted = new Date('2026-11-20T08:00:00Z');
  const due = new Date('2026-11-21T08:00:00Z');
  const at = (hours: number, seconds = 0) => new Date(submitted.getTime() + hours * 3_600_000 + seconds * 1000);

  it('is OK, then DUE_SOON at 20 hours of 24, then OVERDUE at 24 hours and a second', () => {
    expect(slaState(submitted, due, at(19, 59 * 60 + 59))).toBe('OK');
    expect(slaState(submitted, due, at(20))).toBe('DUE_SOON');
    expect(slaState(submitted, due, at(24))).toBe('DUE_SOON');
    expect(slaState(submitted, due, at(24, 1))).toBe('OVERDUE');
    expect(slaState(null, null, at(48))).toBe('OK');
  });
});
