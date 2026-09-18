import { ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { FieldErrors, ValidationFailedError } from '../errors';

/** Flattens nested class-validator errors into `{ "a.b": ["message"] }`. */
export function toFieldErrors(errors: ValidationError[], parentPath = ''): FieldErrors {
  const result: FieldErrors = {};

  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      result[path] = Object.values(error.constraints);
    }
    if (error.children?.length) {
      Object.assign(result, toFieldErrors(error.children, path));
    }
  }

  return result;
}

/**
 * Global validation (security-and-audit.md §6): DTO whitelisting rejects
 * unknown properties, which also blocks mass assignment; failures are 422
 * with a per-field `errors` map (ADR-008).
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    stopAtFirstError: false,
    exceptionFactory: (errors) => new ValidationFailedError(toFieldErrors(errors)),
  });
}
