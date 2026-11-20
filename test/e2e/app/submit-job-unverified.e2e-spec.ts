import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { contractErrors } from '../../support/contract';
import { connectAdmin, resetDatabase } from '../../support/database';

export const COMPLETE = {
  title: 'Rigging lead',
  city: 'Riyadh',
  summary: 'Lead the rigging crew for the season',
  description: 'Shifts of 10 hours, Sunday to Thursday.',
  compensation: 'SAR 12k / mo',
  work_setup: 'ON_SITE',
};

/** Exit test (execution-plan Phase 5, BQ-80): only verified companies publish jobs. */
describe('Submitting a job from an unverified company (e2e)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let company: RegisteredAccount;

  beforeAll(async () => {
    ({ app } = await bootApp());
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
    company = await registerAccount(app, { name: 'Owner', company: { name: 'New Stages', company_type: 'VENUE' } });
  });

  const draft = async (body: object) => {
    const res = await appRequest(app, 'post', '/company/opportunities', company).send(body);
    expect(res.status).toBe(201);
    return res.body.data.id as string;
  };

  it('refuses the JOB with 422 COMPANY_NOT_VERIFIED and keeps it a draft', async () => {
    const id = await draft({ type: 'JOB', employment_type: 'FULL_TIME', ...COMPLETE });
    const res = await appRequest(app, 'post', `/company/opportunities/${id}/submit`, company);
    expect({ status: res.status, code: res.body.code }).toEqual({ status: 422, code: 'COMPANY_NOT_VERIFIED' });
    expect(contractErrors('app', 'post', '/company/opportunities/{id}/submit', 422, res.body)).toEqual([]);
    expect((await appRequest(app, 'get', `/company/opportunities/${id}`, company)).body.data.status).toBe('DRAFT');
  });

  it('accepts a VOLUNTEERING listing from the same company: 200 IN_REVIEW', async () => {
    const id = await draft({ type: 'VOLUNTEERING', ...COMPLETE, compensation: undefined });
    const res = await appRequest(app, 'post', `/company/opportunities/${id}/submit`, company);
    expect({ status: res.status, status_after: res.body.data?.status }).toEqual({
      status: 200,
      status_after: 'IN_REVIEW',
    });
    expect(contractErrors('app', 'post', '/company/opportunities/{id}/submit', 200, res.body)).toEqual([]);
  });

  it('lets the JOB through once the company is verified', async () => {
    const id = await draft({ type: 'JOB', employment_type: 'FULL_TIME', ...COMPLETE });
    await admin.query(`UPDATE app.companies SET verified_at = now() WHERE id = $1`, [company.companyId]);
    const res = await appRequest(app, 'post', `/company/opportunities/${id}/submit`, company);
    expect({ status: res.status, status_after: res.body.data?.status }).toEqual({
      status: 200,
      status_after: 'IN_REVIEW',
    });
  });
});
