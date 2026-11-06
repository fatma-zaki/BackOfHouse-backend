import { createVerify, generateKeyPairSync } from 'node:crypto';
import { FcmPushSender, FetchFn } from './fcm-push-sender';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const credentials = {
  projectId: 'boh-test',
  clientEmail: 'push@boh-test.iam.gserviceaccount.com',
  privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('FcmPushSender', () => {
  let now: number;
  const clock = { now: () => new Date(now) };
  let requests: { url: string; init: RequestInit }[];
  let replies: Record<string, (body: Record<string, unknown>) => Response>;

  const fetchFn: FetchFn = async (url, init) => {
    requests.push({ url, init });
    if (url === 'https://oauth2.googleapis.com/token') return json(200, { access_token: 'at-1', expires_in: 3600 });
    const body = JSON.parse(String(init.body)) as { message: { token: string } };
    return (
      replies[body.message.token] ?? (() => json(200, { name: `projects/boh-test/messages/${body.message.token}` }))
    )(body);
  };

  beforeEach(() => {
    now = Date.parse('2026-11-06T09:00:00Z');
    requests = [];
    replies = {};
  });

  const message = (tokens: string[]) => ({ tokens, title: 'Title', body: 'Body', data: { type: 'x' } });

  it('signs a service-account assertion and sends one v1 request per token', async () => {
    const sender = new FcmPushSender(credentials, clock, fetchFn);
    const results = await sender.send(message(['t1', 't2']));

    expect(results).toEqual([
      { token: 't1', outcome: 'SENT', messageId: 'projects/boh-test/messages/t1' },
      { token: 't2', outcome: 'SENT', messageId: 'projects/boh-test/messages/t2' },
    ]);
    const [tokenRequest, ...sends] = requests;
    const assertion = new URLSearchParams(String(tokenRequest.init.body)).get('assertion')!;
    const [header, claims, signature] = assertion.split('.');
    expect(
      createVerify('RSA-SHA256').update(`${header}.${claims}`).verify(publicKey, Buffer.from(signature, 'base64url')),
    ).toBe(true);
    expect(JSON.parse(Buffer.from(claims, 'base64url').toString())).toMatchObject({
      iss: credentials.clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
    });
    expect(sends.map((r) => r.url)).toEqual([
      'https://fcm.googleapis.com/v1/projects/boh-test/messages:send',
      'https://fcm.googleapis.com/v1/projects/boh-test/messages:send',
    ]);
    expect((sends[0].init.headers as Record<string, string>).authorization).toBe('Bearer at-1');
    expect(JSON.parse(String(sends[0].init.body))).toMatchObject({
      message: { token: 't1', notification: { title: 'Title', body: 'Body' }, data: { type: 'x' } },
    });
  });

  it('reuses the access token until shortly before it expires', async () => {
    const sender = new FcmPushSender(credentials, clock, fetchFn);
    await sender.send(message(['t1']));
    now += 50 * 60_000;
    await sender.send(message(['t1']));
    now += 6 * 60_000;
    await sender.send(message(['t1']));
    expect(requests.filter((r) => r.url.includes('oauth2')).length).toBe(2);
  });

  it('reports uninstalled apps as UNREGISTERED and other failures as ERROR', async () => {
    replies.gone = () => json(404, { error: { status: 'NOT_FOUND', details: [{ errorCode: 'UNREGISTERED' }] } });
    replies.busy = () => json(503, { error: { status: 'UNAVAILABLE', message: 'try later' } });
    const sender = new FcmPushSender(credentials, clock, fetchFn);
    expect(await sender.send(message(['gone', 'busy', 'ok']))).toEqual([
      { token: 'gone', outcome: 'UNREGISTERED' },
      { token: 'busy', outcome: 'ERROR', error: 'FCM 503 UNAVAILABLE: try later' },
      { token: 'ok', outcome: 'SENT', messageId: 'projects/boh-test/messages/ok' },
    ]);
  });

  it('fails when Google refuses the service account', async () => {
    const sender = new FcmPushSender(credentials, clock, async () => json(400, { error: 'invalid_grant' }));
    await expect(sender.send(message(['t1']))).rejects.toThrow('FCM sign-in failed with HTTP 400');
  });
});
