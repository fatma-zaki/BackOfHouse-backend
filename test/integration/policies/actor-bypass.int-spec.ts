import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import { NotesService, UsersAdminService } from '../../../src/modules/backoffice';
import { ClaimsService, CompaniesAdminService } from '../../../src/modules/companies';
import { AccountStatusService } from '../../../src/modules/identity';
import { ModerationService } from '../../../src/modules/moderation';
import { VerificationReviewService } from '../../../src/modules/verification';
import { bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { connectAdmin, resetDatabase } from '../../support/database';
import { memberActor, staffActor } from '../../support/test-actors';

/**
 * Exit test of Phase 4 (execution-plan.md): the services check permissions themselves, so a
 * caller that skips the route guard (a job, another module, a future route) is refused
 * too. A Reviewer calling setFeatured directly gets FORBIDDEN.
 */
describe('Service-level permission checks (actor bypass)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let owner: RegisteredAccount;

  const get = <T>(type: new (...args: never[]) => T): T => app.get(type, { strict: false });

  beforeAll(async () => {
    ({ app } = await bootApp());
    admin = await connectAdmin();
    await resetDatabase(admin);
    owner = await registerAccount(app, { name: 'Owner', company: { name: 'Bypass Co', company_type: 'AGENCY' } });
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  const forbidden = { code: 'FORBIDDEN' };

  it('refuses a Reviewer calling setFeatured', async () => {
    await expect(
      get(CompaniesAdminService).setFeatured(staffActor('REVIEWER'), owner.companyId!, { featured: true, order: 1 }),
    ).rejects.toMatchObject(forbidden);
    const { rows } = await admin.query(`SELECT editors_pick FROM app.companies WHERE id = $1`, [owner.companyId]);
    expect(rows).toEqual([{ editors_pick: false }]);
  });

  it('lets a Super admin call setFeatured', async () => {
    await get(CompaniesAdminService).setFeatured(staffActor('SUPER_ADMIN'), owner.companyId!, {
      featured: true,
      order: 1,
    });
    const { rows } = await admin.query(`SELECT editors_pick, featured_order FROM app.companies WHERE id = $1`, [
      owner.companyId,
    ]);
    expect(rows).toEqual([{ editors_pick: true, featured_order: 1 }]);
  });

  it.each([
    [
      'an Editor suspending an account',
      () => get(AccountStatusService).suspend(staffActor('EDITOR'), owner.userId, { reason: 'x' }),
    ],
    [
      'a member reading the users table',
      () => get(UsersAdminService).list(memberActor(owner.userId), { page: 1, page_size: 20 }),
    ],
    [
      'an Analyst writing a note',
      () => get(NotesService).add(staffActor('ANALYST'), 'users', owner.userId, { body: 'x' }),
    ],
    [
      'an Editor deciding a verification',
      () => get(VerificationReviewService).approve(staffActor('EDITOR'), owner.userId, {}),
    ],
    ['a Support agent deciding a claim', () => get(ClaimsService).approve(staffActor('SUPPORT'), owner.userId)],
    [
      'a Support agent acting on a case',
      () => get(ModerationService).act(staffActor('SUPPORT'), owner.userId, { action: 'DISMISS' }),
    ],
    ['no actor at all', () => get(CompaniesAdminService).list(undefined, { page: 1, page_size: 20 })],
  ])('refuses %s', async (_, call) => {
    await expect(call()).rejects.toMatchObject(forbidden);
  });
});
