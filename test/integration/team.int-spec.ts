import { Test, TestingModule } from '@nestjs/testing';
import { Client } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigModule } from '../../src/config/config.module';
import { DatabaseModule } from '../../src/platform/database/database.module';
import { PrismaService } from '../../src/platform/database/prisma.service';
import { TransactionRunner } from '../../src/platform/database';
import { ClockModule } from '../../src/platform/clock/clock.module';
import { AuditModule } from '../../src/modules/audit/audit.module';
import { AccessModule, StaffSessionsService, TeamService } from '../../src/modules/access';
import { PrismaClient } from '../../src/generated/prisma/client';
import { seedSuperAdmin } from '../../prisma/seed/seeders/super-admin.seeder';
import { applyTestEnv, connectAdmin, resetDatabase } from '../support/database';
import { staffActor } from '../support/test-actors';
import { testDatabaseUrl } from '../support/test-db-state';

const DOMAIN = 'backofhouse.test';

describe('TeamService and staff rules (real Postgres)', () => {
  let moduleRef: TestingModule;
  let admin: Client;
  let team: TeamService;
  let sessions: StaffSessionsService;
  let prisma: PrismaService;
  let transactions: TransactionRunner;

  const activeStaff = async (email: string, role: 'SUPER_ADMIN' | 'REVIEWER' = 'SUPER_ADMIN') =>
    prisma.staffAccount.create({ data: { email, name: email, role, status: 'ACTIVE', activatedAt: new Date() } });

  beforeAll(async () => {
    applyTestEnv({ STAFF_GOOGLE_WORKSPACE_DOMAIN: DOMAIN });
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule, ClockModule, DatabaseModule, AuditModule, AccessModule],
    }).compile();
    await moduleRef.init();
    team = moduleRef.get(TeamService);
    sessions = moduleRef.get(StaffSessionsService);
    prisma = moduleRef.get(PrismaService);
    transactions = moduleRef.get(TransactionRunner);
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await moduleRef.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
  });

  it('invites on the Workspace domain only, once per email, and audits it', async () => {
    const owner = await activeStaff(`owner@${DOMAIN}`);
    const actor = staffActor('SUPER_ADMIN', owner.id);

    const invited = await team.invite(actor, {
      name: 'Reem Alharbi',
      email: `Reem@${DOMAIN.toUpperCase()}`,
      role: 'REVIEWER',
    });
    expect(invited).toMatchObject({ email: `reem@${DOMAIN}`, role: 'REVIEWER', status: 'INVITED' });

    await expect(team.invite(actor, { name: 'X', email: 'x@gmail.com', role: 'EDITOR' })).rejects.toMatchObject({
      code: 'EMAIL_DOMAIN_NOT_ALLOWED',
      status: 422,
    });
    await expect(
      team.invite(actor, { name: 'X', email: `x@${DOMAIN}.evil.com`, role: 'EDITOR' }),
    ).rejects.toMatchObject({
      code: 'EMAIL_DOMAIN_NOT_ALLOWED',
    });
    await expect(team.invite(actor, { name: 'Again', email: `reem@${DOMAIN}`, role: 'EDITOR' })).rejects.toMatchObject({
      code: 'STAFF_ALREADY_EXISTS',
      status: 409,
    });
    const audit = await admin.query(`SELECT action FROM app.audit_logs ORDER BY occurred_at`);
    expect(audit.rows).toEqual([{ action: 'team.invite' }]);
  });

  it('refuses team changes from roles without team.manage, whoever calls the service', async () => {
    await expect(
      team.invite(staffActor('REVIEWER'), { name: 'X', email: `x@${DOMAIN}`, role: 'EDITOR' }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(team.list(staffActor('SUPPORT'))).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(() => team.roles(undefined)).toThrow();
  });

  it('cancels only unused invitations', async () => {
    const owner = await activeStaff(`owner@${DOMAIN}`);
    const actor = staffActor('SUPER_ADMIN', owner.id);
    const invited = await team.invite(actor, { name: 'Sam', email: `sam@${DOMAIN}`, role: 'EDITOR' });
    await team.cancelInvite(actor, invited.id);
    expect(await prisma.staffAccount.findUnique({ where: { id: invited.id } })).toBeNull();
    await expect(team.cancelInvite(actor, owner.id)).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });

  describe('LAST_SUPER_ADMIN', () => {
    it('refuses demoting or disabling the only active Super admin', async () => {
      const owner = await activeStaff(`owner@${DOMAIN}`);
      const actor = staffActor('SUPER_ADMIN', owner.id);
      await expect(team.update(actor, owner.id, { role: 'REVIEWER' })).rejects.toMatchObject({
        code: 'LAST_SUPER_ADMIN',
        status: 409,
      });
      await expect(team.update(actor, owner.id, { status: 'DISABLED' })).rejects.toMatchObject({
        code: 'LAST_SUPER_ADMIN',
      });
    });

    it('lets only one of two concurrent demotions of the last two Super admins succeed', async () => {
      const a = await activeStaff(`a@${DOMAIN}`);
      const b = await activeStaff(`b@${DOMAIN}`);
      const results = await Promise.allSettled([
        team.update(staffActor('SUPER_ADMIN', a.id), a.id, { role: 'REVIEWER' }),
        team.update(staffActor('SUPER_ADMIN', b.id), b.id, { role: 'REVIEWER' }),
      ]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const remaining = await prisma.staffAccount.count({ where: { role: 'SUPER_ADMIN', status: 'ACTIVE' } });
      expect(remaining).toBe(1);
    });
  });

  it('ends every live session on a role change or disable, and audits the change', async () => {
    const owner = await activeStaff(`owner@${DOMAIN}`);
    const reviewer = await activeStaff(`rev@${DOMAIN}`, 'REVIEWER');
    const session = await transactions.run((tx) => sessions.create(tx, reviewer.id, {}));
    const actor = staffActor('SUPER_ADMIN', owner.id);

    await team.update(actor, reviewer.id, { role: 'EDITOR' });
    expect(
      await sessions.resolve({ token: session.token, method: 'GET', csrfHeader: undefined, csrfCookie: undefined }),
    ).toBeNull();
    const row = await prisma.adminSession.findUnique({ where: { id: session.id } });
    expect(row?.revokeReason).toBe('ROLE_CHANGED');
    const audit = await admin.query(`SELECT action, changes FROM app.audit_logs WHERE action = 'team.update'`);
    expect(audit.rows[0].changes).toEqual({
      before: { role: 'REVIEWER', status: 'ACTIVE' },
      after: { role: 'EDITOR', status: 'ACTIVE' },
    });
  });

  it('only a first sign-in activates an invite; re-enabling someone who never signed in returns them to INVITED', async () => {
    const owner = await activeStaff(`owner@${DOMAIN}`);
    const actor = staffActor('SUPER_ADMIN', owner.id);
    const invited = await team.invite(actor, { name: 'Lina', email: `lina@${DOMAIN}`, role: 'SUPPORT' });
    await expect(team.update(actor, invited.id, { status: 'ACTIVE' })).rejects.toMatchObject({
      code: 'INVALID_TRANSITION',
    });
    await team.update(actor, invited.id, { status: 'DISABLED' });
    await expect(team.update(actor, invited.id, { status: 'ACTIVE' })).resolves.toMatchObject({ status: 'INVITED' });
  });

  describe('seeding the first Super admin', () => {
    const client = () => new PrismaClient({ adapter: new PrismaPg({ connectionString: testDatabaseUrl() }) });

    it('creates an INVITED Super admin once, and skips without variables', async () => {
      const seedPrisma = client();
      try {
        const env = {
          SEED_SUPER_ADMIN_EMAIL: `Owner@${DOMAIN}`,
          SEED_SUPER_ADMIN_NAME: 'Owner',
          STAFF_GOOGLE_WORKSPACE_DOMAIN: DOMAIN,
        };
        await expect(seedSuperAdmin(seedPrisma, env)).resolves.toBe('created');
        await expect(seedSuperAdmin(seedPrisma, env)).resolves.toBe('exists');
        await expect(seedSuperAdmin(seedPrisma, {})).resolves.toBe('skipped');
        await expect(seedSuperAdmin(seedPrisma, { ...env, SEED_SUPER_ADMIN_EMAIL: 'owner@gmail.com' })).rejects.toThrow(
          /must be on backofhouse.test/,
        );
        expect(await prisma.staffAccount.findMany({ select: { email: true, role: true, status: true } })).toEqual([
          { email: `owner@${DOMAIN}`, role: 'SUPER_ADMIN', status: 'INVITED' },
        ]);
      } finally {
        await seedPrisma.$disconnect();
      }
    });
  });
});
