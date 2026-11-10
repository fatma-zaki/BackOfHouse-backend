import type { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import type { Response } from 'supertest';
import { EICAR_TEST_STRING } from '../../../src/platform/scanning';
import { InMemoryStorageAdapter, STORAGE_PORT } from '../../../src/platform/storage';
import { appRequest, bootApp, RegisteredAccount, registerAccount } from '../../support/app-harness';
import { contractErrors } from '../../support/contract';
import { connectAdmin, resetDatabase } from '../../support/database';

const PDF = Buffer.from('%PDF-1.7\n1 0 obj << >> endobj\n%%EOF\n');
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)]);

/**
 * Exit test of Phase 3b (execution-plan.md): an individual's verification request over
 * HTTP, with bodies checked against contracts/app. Upload after submit → 409
 * `VERIFICATION_LOCKED`; submit without both documents → 409 `VERIFICATION_INCOMPLETE`.
 */
describe('Verification request (e2e)', () => {
  let app: NestExpressApplication;
  let admin: Client;
  let storage: InMemoryStorageAdapter;
  let sara: RegisteredAccount;

  const upload = (account: RegisteredAccount, document: string, file: Buffer, name = 'iqama.pdf') =>
    appRequest(app, 'post', '/me/verification/documents', account)
      .field('document', document)
      .attach('file', file, name);

  const expectContract = (res: Response, method: string, path: string, status: number) => {
    expect({ status: res.status, body: res.status === status ? undefined : res.body }).toEqual({
      status,
      body: undefined,
    });
    expect(contractErrors('app', method, path, status, res.body)).toEqual([]);
  };

  beforeAll(async () => {
    ({ app } = await bootApp());
    storage = app.get(STORAGE_PORT, { strict: false });
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
    storage.clear();
    sara = await registerAccount(app, { name: 'Sara Al-Qahtani' });
  });

  it('starts as an empty DRAFT', async () => {
    const res = await appRequest(app, 'get', '/me/verification', sara);
    expectContract(res, 'get', '/me/verification', 200);
    expect(res.body.data).toEqual({ status: 'DRAFT', files: {}, submitted_at: null });
  });

  it('uploads both documents, submits, then locks', async () => {
    const identity = await upload(sara, 'IDENTITY', PDF, 'C:\\fakepath\\iqama.pdf');
    expectContract(identity, 'post', '/me/verification/documents', 200);
    expect(identity.body.data.files).toEqual({ IDENTITY: 'iqama.pdf' });

    const experience = await upload(sara, 'EXPERIENCE', PNG, 'certificate.png');
    expect(experience.body.data.files).toEqual({ IDENTITY: 'iqama.pdf', EXPERIENCE: 'certificate.png' });
    expect([...storage.objects.keys()]).toHaveLength(2);
    expect(
      [...storage.objects.keys()].every((key) => key.startsWith(`private-documents/verification/${sara.userId}/`)),
    ).toBe(true);

    const submitted = await appRequest(app, 'post', '/me/verification/submit', sara);
    expectContract(submitted, 'post', '/me/verification/submit', 200);
    expect(submitted.body.data).toMatchObject({ status: 'IN_REVIEW', submitted_at: expect.any(String) });

    const late = await upload(sara, 'IDENTITY', PDF);
    expect({ status: late.status, code: late.body.code }).toEqual({ status: 409, code: 'VERIFICATION_LOCKED' });
    const again = await appRequest(app, 'post', '/me/verification/submit', sara);
    expect({ status: again.status, code: again.body.code }).toEqual({ status: 409, code: 'VERIFICATION_LOCKED' });
    expect([...storage.objects.keys()]).toHaveLength(2);

    const { rows } = await admin.query(
      `SELECT event_name FROM app.outbox_events WHERE event_name LIKE 'verification.%'`,
    );
    expect(rows).toEqual([{ event_name: 'verification.submitted' }]);
  });

  it('refuses to submit without both documents', async () => {
    const empty = await appRequest(app, 'post', '/me/verification/submit', sara);
    expect({ status: empty.status, code: empty.body.code }).toEqual({ status: 409, code: 'VERIFICATION_INCOMPLETE' });
    await upload(sara, 'IDENTITY', PDF);
    const half = await appRequest(app, 'post', '/me/verification/submit', sara);
    expect({ status: half.status, code: half.body.code }).toEqual({ status: 409, code: 'VERIFICATION_INCOMPLETE' });
    expect((await appRequest(app, 'get', '/me/verification', sara)).body.data.status).toBe('DRAFT');
  });

  it('replaces a document of the same type and removes the old file', async () => {
    await upload(sara, 'IDENTITY', PDF, 'old.pdf');
    const [oldKey] = [...storage.objects.keys()];
    const res = await upload(sara, 'IDENTITY', PNG, 'new.png');
    expect(res.body.data.files).toEqual({ IDENTITY: 'new.png' });
    expect([...storage.objects.keys()]).toHaveLength(1);
    expect(storage.objects.has(oldKey)).toBe(false);
  });

  it('checks the real file type, the size and the virus scan', async () => {
    const exe = await upload(sara, 'IDENTITY', Buffer.from('MZ\x90\x00 not a pdf'), 'iqama.pdf');
    expect({ status: exe.status, errors: exe.body.errors }).toEqual({
      status: 422,
      errors: { file: ['must be a PDF, JPEG or PNG file'] },
    });

    const big = await upload(sara, 'IDENTITY', Buffer.concat([PDF, Buffer.alloc(10 * 1024 * 1024)]));
    expect({ status: big.status, code: big.body.code }).toEqual({ status: 413, code: 'FILE_TOO_LARGE' });

    const infected = await upload(sara, 'IDENTITY', Buffer.concat([PDF, Buffer.from(EICAR_TEST_STRING)]));
    expect({ status: infected.status, errors: infected.body.errors }).toEqual({
      status: 422,
      errors: { file: ['did not pass the virus scan'] },
    });

    const wrongType = await upload(sara, 'PASSPORT', PDF);
    expect(wrongType.body.errors).toEqual({ document: ['must be IDENTITY or EXPERIENCE'] });
    const noFile = await appRequest(app, 'post', '/me/verification/documents', sara).field('document', 'IDENTITY');
    expect(noFile.body.errors).toEqual({ file: ['is required'] });

    expect(storage.objects.size).toBe(0);
    expect((await appRequest(app, 'get', '/me/verification', sara)).body.data.files).toEqual({});
  });

  it('is for individuals only', async () => {
    const company = await registerAccount(app, { name: 'Owner', company: { name: 'Delta', company_type: 'OTHER' } });
    for (const res of [
      await appRequest(app, 'get', '/me/verification', company),
      await upload(company, 'IDENTITY', PDF),
      await appRequest(app, 'post', '/me/verification/submit', company),
    ]) {
      expect({ status: res.status, code: res.body.code }).toEqual({ status: 403, code: 'FORBIDDEN' });
    }
  });
});
