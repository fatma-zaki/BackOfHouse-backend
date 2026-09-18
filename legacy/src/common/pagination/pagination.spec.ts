import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PaginationQueryDto, paginate, parsePagination } from './pagination.dto';
import { PaginationDefaults } from '../constants';

function validate(query: Record<string, unknown>) {
  const dto = plainToInstance(PaginationQueryDto, query);
  return { dto, errors: validateSync(dto) };
}

describe('pagination', () => {
  it('applies defaults when nothing is supplied', () => {
    const { dto, errors } = validate({});

    expect(errors).toHaveLength(0);
    expect(parsePagination(dto)).toEqual({ page: 1, limit: PaginationDefaults.LIMIT, offset: 0 });
  });

  it('coerces query-string numbers', () => {
    const { dto, errors } = validate({ page: '3', limit: '10' });

    expect(errors).toHaveLength(0);
    expect(parsePagination(dto)).toEqual({ page: 3, limit: 10, offset: 20 });
  });

  it.each([
    [{ limit: '101' }, 'limit'],
    [{ limit: '0' }, 'limit'],
    [{ page: '0' }, 'page'],
    [{ page: '-4' }, 'page'],
    [{ page: 'abc' }, 'page'],
    [{ sortOrder: 'sideways' }, 'sortOrder'],
  ])('rejects %p', (query, property) => {
    const { errors } = validate(query);

    expect(errors.map((error) => error.property)).toContain(property);
  });

  it('clamps the limit even if validation were bypassed', () => {
    const dto = Object.assign(new PaginationQueryDto(), { page: 1, limit: 1_000_000 });

    expect(parsePagination(dto).limit).toBe(PaginationDefaults.MAX_LIMIT);
  });

  it('builds the response metadata', () => {
    expect(paginate(['a', 'b'], 2, 2, 5)).toEqual({
      data: ['a', 'b'],
      meta: { page: 2, limit: 2, total: 5, totalPages: 3 },
    });
  });
});
