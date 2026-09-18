import { ArgumentsHost, HttpStatus, NotFoundException as NestNotFound } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ConflictException, ErrorCode } from '../exceptions/business.exceptions';

function hostFor(response: { status: jest.Mock; json: jest.Mock }): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url: '/api/v1/things', method: 'GET' }),
    }),
  } as unknown as ArgumentsHost;
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();
  let response: { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    response = { status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);
  });

  it('renders a business exception with its code', () => {
    filter.catch(new ConflictException('Slug taken'), hostFor(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: ErrorCode.CONFLICT, message: 'Slug taken', path: '/api/v1/things' }),
    );
  });

  it('normalises framework exceptions into the same envelope', () => {
    filter.catch(new NestNotFound('Cannot GET /nope'), hostFor(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ code: ErrorCode.NOT_FOUND }));
  });

  it('never leaks details of an unexpected error', () => {
    const leaky = new Error('duplicate key value violates users_email_key password=hunter2');

    filter.catch(leaky, hostFor(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = response.json.mock.calls[0][0] as Record<string, unknown>;
    expect(body['message']).toBe('An unexpected error occurred');
    expect(JSON.stringify(body)).not.toContain('hunter2');
    expect(body).not.toHaveProperty('stack');
  });
});
