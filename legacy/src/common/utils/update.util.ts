/**
 * Builds a database update payload from an explicit allow-list of DTO fields.
 *
 * This is the project's mass-assignment guard: a request body is never handed
 * to the database directly, only the fields a caller is permitted to change for
 * that resource are copied across, and `undefined` values are dropped so a
 * partial update never clears untouched columns.
 */
export function pickDefined<T extends object>(
  source: T,
  allowedFields: readonly (keyof T)[],
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of allowedFields) {
    const value = source[field];
    if (value !== undefined) {
      payload[field as string] = value;
    }
  }

  return payload;
}

export function hasUpdates(payload: Record<string, unknown>): boolean {
  return Object.keys(payload).length > 0;
}
