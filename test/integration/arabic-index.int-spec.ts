import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import { SAUDI_COMPANY_NAMES, SAUDI_PERSON_NAMES } from '../fixtures/saudi-names';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../support/app-harness';
import { connectAdmin, resetDatabase } from '../support/database';

const names = (res: { body: { data: { name: string }[] } }) => res.body.data.map((row) => row.name);

/**
 * Exit test of Phase 3a (execution-plan.md): names sort in the request language with ICU
 * collation, and search ignores alef forms, hamza and ta marbuta (app.normalize_ar).
 */
describe('Arabic A–Z and search (real Postgres, ICU)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let viewer: RegisteredAccount;

  beforeAll(async () => {
    ({ app } = await bootApp());
    admin = await connectAdmin();
    await resetDatabase(admin);
    viewer = await registerAccount(app, { name: 'Viewer', locale: 'ar' });
    // ≥ 50 real names, seeded directly: registration would take a request per name.
    expect(SAUDI_COMPANY_NAMES.length + SAUDI_PERSON_NAMES.length).toBeGreaterThanOrEqual(50);
    await admin.query(
      `INSERT INTO app.users (id, account_type, full_name, full_name_normalized, email, profile_status, updated_at)
       SELECT gen_random_uuid(), 'INDIVIDUAL', n, app.normalize_ar(n), 'person' || i || '@seed.test', 'PROFESSIONAL', now()
       FROM unnest($1::text[]) WITH ORDINALITY AS t(n, i)`,
      [SAUDI_PERSON_NAMES],
    );
    await admin.query(
      `WITH accounts AS (
         INSERT INTO app.users (id, account_type, full_name, full_name_normalized, email, updated_at)
         SELECT gen_random_uuid(), 'COMPANY', n, app.normalize_ar(n), 'company' || i || '@seed.test', now()
         FROM unnest($1::text[]) WITH ORDINALITY AS t(n, i)
         RETURNING id, full_name
       )
       INSERT INTO app.companies (id, account_user_id, name, name_normalized, company_type, updated_at)
       SELECT gen_random_uuid(), id, full_name, app.normalize_ar(full_name), 'OTHER', now() FROM accounts`,
      [SAUDI_COMPANY_NAMES],
    );
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  it('sorts companies by Arabic collation, across pages', async () => {
    const page1 = await appRequest(app, 'get', '/companies?page=1&page_size=20', viewer, 'ar');
    const page2 = await appRequest(app, 'get', '/companies?page=2&page_size=20', viewer, 'ar');
    expect(page1.body.meta.has_more).toBe(true);
    expect(page2.body.meta.has_more).toBe(false);
    const expected = [...SAUDI_COMPANY_NAMES].sort(new Intl.Collator('ar').compare);
    expect([...names(page1), ...names(page2)]).toEqual(expected);
  });

  it('sorts professionals by Arabic collation', async () => {
    const res = await appRequest(app, 'get', '/professionals?page_size=50', viewer, 'ar');
    expect(names(res)).toEqual([...SAUDI_PERSON_NAMES].sort(new Intl.Collator('ar').compare));
  });

  it('puts names in alphabet order, not code-point order', async () => {
    const res = await appRequest(app, 'get', '/professionals?page_size=50', viewer, 'ar');
    const order = names(res);
    // Alphabet order: ث before خ, ض before ظ, غ before ف; every alef form leads.
    expect(order.indexOf('ثامر العسيري')).toBeLessThan(order.indexOf('خالد الحربي'));
    expect(order.indexOf('ضحى البلوي')).toBeLessThan(order.indexOf('ظافر الشهراني'));
    expect(order.indexOf('غادة الثبيتي')).toBeLessThan(order.indexOf('فاطمة الزهراني'));
    expect(order.slice(0, 3).sort()).toEqual(['آمنة القحطاني', 'أحمد العتيبي', 'إبراهيم الشهري'].sort());
  });

  it.each(['أحمد', 'احمد', 'إحمد', 'آحمد'])('finds أحمد العتيبي when searching %s', async (q) => {
    const res = await appRequest(app, 'get', `/professionals?q=${encodeURIComponent(q)}`, viewer, 'ar');
    expect(names(res)).toEqual(['أحمد العتيبي']);
  });

  it('finds both cement companies whichever alef is typed, and ignores ta marbuta', async () => {
    for (const q of ['اسمنت', 'أسمنت', 'إسمنت']) {
      const res = await appRequest(app, 'get', `/companies?q=${encodeURIComponent(q)}`, viewer, 'ar');
      expect(names(res).sort()).toEqual(['أسمنت اليمامة', 'إسمنت القصيم'].sort());
    }
    const res = await appRequest(app, 'get', `/companies?q=${encodeURIComponent('الزراعيه')}`, viewer, 'ar');
    expect(names(res)).toEqual(['تبوك الزراعية']);
  });

  it('treats % and _ in a search as plain text', async () => {
    expect(names(await appRequest(app, 'get', '/companies?q=%25', viewer, 'ar'))).toEqual([]);
    expect(names(await appRequest(app, 'get', '/companies?q=_', viewer, 'ar'))).toEqual([]);
  });
});
