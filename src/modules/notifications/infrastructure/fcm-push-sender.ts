import { createSign } from 'node:crypto';
import type { Clock } from '../../../common/clock/clock';
import { PushMessage, PushSender, PushTokenResult } from './push-sender';

/** A Firebase service account (Project settings → Service accounts → private key). */
export interface FcmCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export type FetchFn = (url: string, init: RequestInit) => Promise<Response>;

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const ASSERTION_TTL_SECONDS = 3600;
/** Renew the access token this long before Google says it expires. */
const RENEW_EARLY_MS = 5 * 60_000;
const MAX_ERROR_LENGTH = 300;

const base64url = (value: string | Buffer) => Buffer.from(value).toString('base64url');

interface FcmErrorBody {
  error?: { status?: string; message?: string; details?: { errorCode?: string }[] };
}

/**
 * Firebase Cloud Messaging, HTTP v1 API. Signs a service-account assertion with
 * node:crypto (RS256), trades it for an OAuth access token (cached until shortly before
 * it expires) and sends one request per device token, as v1 has no multicast.
 */
export class FcmPushSender implements PushSender {
  readonly provider = 'fcm';
  private accessToken: { value: string; expiresAt: number } | null = null;

  constructor(
    private readonly credentials: FcmCredentials,
    private readonly clock: Clock,
    private readonly fetchFn: FetchFn = (url, init) => fetch(url, init),
  ) {}

  async send(message: PushMessage): Promise<PushTokenResult[]> {
    const accessToken = await this.token();
    const url = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(this.credentials.projectId)}/messages:send`;
    const results: PushTokenResult[] = [];
    for (const token of message.tokens) {
      const response = await this.fetchFn(url, {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: message.title, body: message.body },
            data: message.data,
            android: { priority: 'HIGH' },
            apns: { payload: { aps: { sound: 'default' } } },
          },
        }),
      });
      results.push(await this.resultOf(token, response));
    }
    return results;
  }

  private async resultOf(token: string, response: Response): Promise<PushTokenResult> {
    if (response.ok) {
      const body = (await response.json()) as { name?: string };
      return { token, outcome: 'SENT', messageId: body.name };
    }
    const body = (await response.json().catch(() => ({}))) as FcmErrorBody;
    const errorCode = body.error?.details?.find((detail) => detail.errorCode)?.errorCode;
    // UNREGISTERED: the app was uninstalled or the token rotated; the token is dropped.
    if (response.status === 404 || errorCode === 'UNREGISTERED') return { token, outcome: 'UNREGISTERED' };
    if (response.status === 401) this.accessToken = null;
    const error = `FCM ${response.status} ${errorCode ?? body.error?.status ?? ''}: ${body.error?.message ?? ''}`;
    return { token, outcome: 'ERROR', error: error.slice(0, MAX_ERROR_LENGTH) };
  }

  private async token(): Promise<string> {
    const now = this.clock.now().getTime();
    if (this.accessToken && now < this.accessToken.expiresAt) return this.accessToken.value;

    const issuedAt = Math.floor(now / 1000);
    const unsigned = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(
      JSON.stringify({
        iss: this.credentials.clientEmail,
        scope: SCOPE,
        aud: TOKEN_URL,
        iat: issuedAt,
        exp: issuedAt + ASSERTION_TTL_SECONDS,
      }),
    )}`;
    const signature = createSign('RSA-SHA256').update(unsigned).sign(this.credentials.privateKey);
    const response = await this.fetchFn(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: `${unsigned}.${base64url(signature)}`,
      }).toString(),
    });
    if (!response.ok) throw new Error(`FCM sign-in failed with HTTP ${response.status}`);
    const body = (await response.json()) as { access_token: string; expires_in: number };
    this.accessToken = { value: body.access_token, expiresAt: now + body.expires_in * 1000 - RENEW_EARLY_MS };
    return body.access_token;
  }
}
