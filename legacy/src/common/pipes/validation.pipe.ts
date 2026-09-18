import { HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { BusinessException, ErrorCode } from '../exceptions/business.exceptions';

/** Flattens nested class-validator errors into a client-friendly list. */
export function formatValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): Record<string, unknown>[] {
  return errors.flatMap((error) => {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    const current = error.constraints
      ? [{ property: path, constraints: Object.values(error.constraints) }]
      : [];
    const children = error.children?.length ? formatValidationErrors(error.children, path) : [];
    return [...current, ...children];
  });
}

/** Thrown by the global ValidationPipe so validation errors share the error format. */
export class ValidationException extends BusinessException {
  constructor(errors: ValidationError[]) {
    super(
      HttpStatus.BAD_REQUEST,
      'Validation failed',
      ErrorCode.VALIDATION_FAILED,
      formatValidationErrors(errors),
    );
  }
}
