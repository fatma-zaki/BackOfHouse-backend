import { HttpStatus, NotFoundException } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ConflictError, ValidationFailedError } from '../errors';
import { RequestContext } from '../context/request-context';
import { toFieldErrors } from '../pipes/validation.pipe';
import { backoffSeconds } from '../../platform/outbox/outbox-dispatcher';

describe('AllExceptionsFilter.toResponse', () => {
  const filter = new AllExceptionsFilter();
  const inRequest = <T>(work: () => T): T => RequestContext.run({ requestId: 'trace-123' }, work);

  it('renders a domain error with its code and field errors', () => {
    const { status, body } = inRequest(() => filter.toResponse(new ValidationFailedError({ name: ['is required'] })));
    expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(body).toEqual({
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      trace_id: 'trace-123',
      errors: { name: ['is required'] },
    });
  });

  it('keeps a domain-specific code', () => {
    const { status, body } = inRequest(() =>
      filter.toResponse(new ConflictError('Already linked', 'COMPANY_ALREADY_LINKED')),
    );
    expect(status).toBe(409);
    expect(body.code).toBe('COMPANY_ALREADY_LINKED');
  });

  it('maps framework exceptions', () => {
    expect(inRequest(() => filter.toResponse(new NotFoundException())).body.code).toBe('NOT_FOUND');
    expect(inRequest(() => filter.toResponse(new ThrottlerException())).status).toBe(429);
  });

  it('hides unexpected errors', () => {
    const { status, body } = inRequest(() => filter.toResponse(new Error('SELECT * FROM secrets')));
    expect(status).toBe(500);
    expect(body).toEqual({ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', trace_id: 'trace-123' });
  });

  it('uses "system" as trace id outside a request', () => {
    expect(filter.toResponse(new Error('x')).body.trace_id).toBe('system');
  });
});

describe('toFieldErrors', () => {
  it('flattens nested validation errors into dotted paths', () => {
    const result = toFieldErrors([
      { property: 'name', constraints: { isString: 'name must be a string' }, children: [] },
      {
        property: 'address',
        children: [{ property: 'city', constraints: { maxLength: 'too long' }, children: [] }],
      },
    ]);
    expect(result).toEqual({ name: ['name must be a string'], 'address.city': ['too long'] });
  });
});

describe('outbox backoff', () => {
  it('grows exponentially and is capped', () => {
    expect([1, 2, 3, 4].map(backoffSeconds)).toEqual([2, 4, 8, 16]);
    expect(backoffSeconds(30)).toBe(3600);
  });
});
