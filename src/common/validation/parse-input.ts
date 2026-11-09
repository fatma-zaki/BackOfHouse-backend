import type { z } from 'zod';
import { FieldErrors, ValidationFailedError } from '../errors';

/**
 * Validates a request body or query with zod inside a service: 422 `VALIDATION_FAILED`
 * with field errors keyed by the request field name (ADR-008).
 */
export function parseInput<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const parsed = schema.safeParse(input ?? {});
  if (parsed.success) return parsed.data;
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) (errors[issue.path.join('.') || '(body)'] ??= []).push(issue.message);
  throw new ValidationFailedError(errors);
}

/** Escapes `%`, `_` and `\` for a SQL LIKE pattern (used with `ESCAPE '\'`). */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
