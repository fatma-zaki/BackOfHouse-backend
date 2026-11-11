import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { connectAdmin, resetDatabase } from '../../support/database';

type Method = 'post' | 'put' | 'patch';

/**
 * Exit test of Phase 4 (execution-plan.md): only a reviewer's decision makes a member or a
 * company verified. Every profile and company write is called with verification fields in
 * the input; each refuses them (422, unknown key) and nothing becomes verified.
 */
describe('Verified only by a decision', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let member: RegisteredAccount;
  let company: RegisteredAccount;

  const sneaky = { is_verified: true, verified: true, verification_level: 3, verified_at: '2026-01-01T00:00:00Z' };

  const memberWrites: [Method, string, object][] = [
    [
      'patch',
      '/me/profile',
      {
        name: 'Member One',
        headline: '',
        city: '',
        about: '',
        profile_status: 'PROFESSIONAL',
        interests: [],
        contact_privacy: {},
      },
    ],
    ['post', '/me/experience', { role: 'Rigger', company: 'Co', start: '2020-01-01' }],
    ['post', '/me/projects', { year: 2024, category: 'Concerts', title: 'Show', role: 'Crew' }],
    ['put', '/me/skills', { skill_ids: [] }],
  ];

  const companyWrites: [Method, string, object][] = [
    ['patch', '/company', { city: 'Riyadh' }],
    [
      'post',
      '/company/projects',
      { title: 'Expo', description: 'Stand', location: 'Jeddah', category: 'Exhibitions', started_at: '2026-01-01' },
    ],
  ];

  beforeAll(async () => {
    ({ app } = await bootApp());
    admin = await connectAdmin();
    await resetDatabase(admin);
    member = await registerAccount(app, { name: 'Member One' });
    company = await registerAccount(app, { name: 'Owner', company: { name: 'Trust Co', company_type: 'OTHER' } });
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  it.each(memberWrites)('member %s %s refuses verification fields', async (method, path, body) => {
    const res = await appRequest(app, method, path, member).send({ ...body, ...sneaky });
    expect(res.status).toBe(422);
  });

  it.each(companyWrites)('company %s %s refuses verification fields', async (method, path, body) => {
    const res = await appRequest(app, method, path, company).send({ ...body, ...sneaky });
    expect(res.status).toBe(422);
  });

  it('leaves both unverified', async () => {
    expect((await appRequest(app, 'get', '/me', member)).body.data.is_verified).toBe(false);
    expect((await appRequest(app, 'get', '/me/profile', member)).body.data).toMatchObject({
      verified: false,
      verification_level: 0,
    });
    expect((await appRequest(app, 'get', '/company', company)).body.data.is_verified).toBe(false);
    const { rows } = await admin.query(
      `SELECT (SELECT count(*)::int FROM app.verification_requests WHERE status = 'APPROVED') AS approved,
              (SELECT count(*)::int FROM app.companies WHERE verified_at IS NOT NULL) AS companies`,
    );
    expect(rows[0]).toEqual({ approved: 0, companies: 0 });
  });
});
