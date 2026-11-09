import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../support/app-harness';
import { connectAdmin, resetDatabase } from '../support/database';

/**
 * Exit test of Phase 3a (execution-plan.md): an individual's email and phone appear in no
 * app response except their own (`/me`), whether or not they share them. Sharing only
 * opens them to a company from the CONTACT stage of an application (Phase 5,
 * contact-visibility.policy.ts).
 */
describe('Contact privacy over the app surface', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let sharer: RegisteredAccount;
  let private_: RegisteredAccount;
  let viewer: RegisteredAccount;
  let company: RegisteredAccount;

  /** The account's email and phone in every form they could be written. */
  const contactForms = (account: RegisteredAccount) => [
    account.email,
    account.phone,
    account.phone.replace('+', ''),
    account.phone.slice(-9),
  ];

  const profileEdit = (share: boolean) => ({
    name: 'Shared Person',
    headline: 'Rigger',
    city: 'Riyadh',
    about: '',
    profile_status: 'PROFESSIONAL',
    interests: [],
    contact_privacy: { share_email: share, share_phone: share },
  });

  beforeAll(async () => {
    ({ app } = await bootApp());
    admin = await connectAdmin();
    await resetDatabase(admin);
    sharer = await registerAccount(app, { name: 'Shared Person' });
    private_ = await registerAccount(app, { name: 'Private Person' });
    viewer = await registerAccount(app, { name: 'Viewer Person' });
    company = await registerAccount(app, {
      name: 'Company Owner',
      company: { name: 'Gamma Co', company_type: 'OTHER' },
    });
    await appRequest(app, 'patch', '/me/profile', sharer).send(profileEdit(true));
    await appRequest(app, 'patch', '/me/profile', private_).send({ ...profileEdit(false), name: 'Private Person' });
    await appRequest(app, 'put', `/professionals/${sharer.userId}/connection`, viewer);
    await appRequest(app, 'put', `/companies/${company.companyId}/follow`, sharer);
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  it('keeps both members off every directory and company response, shared or not', async () => {
    const calls: [Parameters<typeof appRequest>[1], string, RegisteredAccount][] = [
      ['get', '/professionals?page_size=50', viewer],
      ['get', '/professionals?q=person', viewer],
      ['put', `/professionals/${sharer.userId}/connection`, viewer],
      ['put', `/professionals/${private_.userId}/connection`, viewer],
      ['delete', `/professionals/${private_.userId}/connection`, viewer],
      ['get', '/companies', viewer],
      ['get', `/companies/${company.companyId}`, viewer],
      ['get', `/companies/${company.companyId}/projects`, viewer],
      ['get', '/company', company],
      ['get', '/company/stats', company],
      ['get', '/me', company],
      ['get', '/me', viewer],
      ['get', '/me/profile', viewer],
    ];
    const hidden = [...contactForms(sharer), ...contactForms(private_)];
    for (const [method, path, account] of calls) {
      const res = await appRequest(app, method, path, account);
      const text = JSON.stringify(res.body);
      expect({
        call: `${method} ${path}`,
        status: res.status < 300,
        leaked: hidden.filter((v) => text.includes(v)),
      }).toEqual({
        call: `${method} ${path}`,
        status: true,
        leaked: [],
      });
    }
  });

  it('shows members their own details and sharing choices only', async () => {
    const me = await appRequest(app, 'get', '/me', sharer);
    expect(me.body.data).toMatchObject({ email: sharer.email, phone: sharer.phone });
    const profile = await appRequest(app, 'get', '/me/profile', sharer);
    expect(profile.body.data.contact_privacy).toEqual({ share_email: true, share_phone: true });
    const fresh = await appRequest(app, 'get', '/me/profile', viewer);
    expect(fresh.body.data.contact_privacy).toEqual({ share_email: false, share_phone: false });
  });
});
