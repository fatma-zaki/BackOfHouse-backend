import { ValidationFailedError } from '../errors';

/**
 * Opaque keyset cursors: base64url JSON of the sort key of the last row.
 * Clients must treat them as opaque; the server validates the shape on decode.
 */
export type CursorPayload = Record<string, string | number>;

const MAX_CURSOR_LENGTH = 512;

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string, expectedKeys: readonly string[]): CursorPayload {
  const invalid = new ValidationFailedError({ cursor: ['is not a valid cursor'] });

  if (cursor.length > MAX_CURSOR_LENGTH || !/^[A-Za-z0-9_-]+$/.test(cursor)) {
    throw invalid;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw invalid;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw invalid;
  }

  const record = parsed as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const expected = [...expectedKeys].sort();
  const sameKeys = keys.length === expected.length && keys.every((key, index) => key === expected[index]);
  const scalarValues = Object.values(record).every((value) => typeof value === 'string' || typeof value === 'number');

  if (!sameKeys || !scalarValues) {
    throw invalid;
  }

  return record as CursorPayload;
}
