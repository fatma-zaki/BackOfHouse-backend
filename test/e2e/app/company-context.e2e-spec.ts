import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { connectAdmin, resetDatabase } from '../../support/database';

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * Exit test of Phase 3a (execution-plan.md): individuals and Company Accounts are separate
 * contexts (BQ-60). The wrong account type gets 403 `FORBIDDEN` (docs/app/README.md §2;
 * the Flutter contract has no `WRONG_ACCOUNT_CONTEXT`, D3), and another company's resource
 * is 404, so ids never leak.
 */
describe('Company context (e2e)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let member: RegisteredAccount;
  let company: RegisteredAccount;
  let rival: RegisteredAccount;
  let rivalProjectId: string;

  const project = {
    title: 'Expo stand',
    description: 'Stand build.',
    location: 'Jeddah',
    category: 'Exhibitions',
    started_at: '2026-09-01',
  };

  beforeAll(async () => {
    ({ app } = await bootApp());
    admin = await connectAdmin();
    await resetDatabase(admin);
    member = await registerAccount(app, { name: 'Nora Member' });
    company = await registerAccount(app, {
      name: 'Owner One',
      company: { name: 'Alpha Events', company_type: 'AGENCY' },
    });
    rival = await registerAccount(app, { name: 'Owner Two', company: { name: 'Beta Venues', company_type: 'VENUE' } });
    const created = await appRequest(app, 'post', '/company/projects', rival).send(project);
    rivalProjectId = created.body.data.id;
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  const companyRoutes: [Method, string][] = [
    ['get', '/company'],
    ['patch', '/company'],
    ['get', '/company/stats'],
    ['get', '/company/projects'],
    ['post', '/company/projects'],
    ['patch', '/company/projects/{id}'],
    ['delete', '/company/projects/{id}'],
  ];

  const individualRoutes: [Method, string][] = [
    ['get', '/me/profile'],
    ['patch', '/me/profile'],
    ['post', '/me/experience'],
    ['post', '/me/projects'],
    ['put', '/me/skills'],
    ['get', '/companies'],
    ['get', '/companies/{company}'],
    ['put', '/companies/{company}/follow'],
    ['delete', '/companies/{company}/follow'],
    ['get', '/companies/{company}/projects'],
    ['get', '/professionals'],
    ['put', '/professionals/{member}/connection'],
    ['delete', '/professionals/{member}/connection'],
  ];

  const fill = (path: string) =>
    path.replace('{id}', rivalProjectId).replace('{company}', rival.companyId!).replace('{member}', member.userId);

  it.each(companyRoutes)('refuses an individual on %s %s with 403 FORBIDDEN', async (method, path) => {
    const res = await appRequest(app, method, fill(path), member).send(project);
    expect({ status: res.status, code: res.body.code }).toEqual({ status: 403, code: 'FORBIDDEN' });
  });

  it.each(individualRoutes)('refuses a Company Account on %s %s with 403 FORBIDDEN', async (method, path) => {
    const res = await appRequest(app, method, fill(path), company).send({});
    expect({ status: res.status, code: res.body.code }).toEqual({ status: 403, code: 'FORBIDDEN' });
  });

  it.each([
    ['patch', project],
    ['delete', undefined],
  ] as const)("answers 404 when a company %ss another company's project", async (method, body) => {
    const res = await appRequest(app, method, `/company/projects/${rivalProjectId}`, company).send(body);
    expect({ status: res.status, code: res.body.code }).toEqual({ status: 404, code: 'NOT_FOUND' });
    const { rows } = await admin.query(`SELECT title FROM app.company_projects WHERE id = $1`, [rivalProjectId]);
    expect(rows).toEqual([{ title: 'Expo stand' }]);
  });

  it("never lists another company's projects in its own workspace", async () => {
    const res = await appRequest(app, 'get', '/company/projects', company);
    expect(res.body.data).toEqual([]);
  });

  it('refuses anonymous calls with 401', async () => {
    expect((await appRequest(app, 'get', '/company')).status).toBe(401);
    expect((await appRequest(app, 'get', '/companies')).status).toBe(401);
  });
});
