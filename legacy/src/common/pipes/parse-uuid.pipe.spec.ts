import { ParseUuidPipe } from './parse-uuid.pipe';
import { BadRequestException } from '../exceptions/business.exceptions';

describe('ParseUuidPipe', () => {
  const pipe = new ParseUuidPipe();
  const metadata = { type: 'param' as const, data: 'id' };

  it('accepts a UUID', () => {
    const id = 'aaaa2222-2222-4222-8222-222222222222';
    expect(pipe.transform(id, metadata)).toBe(id);
  });

  it.each(['not-a-uuid', '1', '', "1' OR '1'='1", '../../etc/passwd', 'aaaa2222-2222-4222-8222-2222222222229'])(
    'rejects %p',
    (value) => {
      expect(() => pipe.transform(value, metadata)).toThrow(BadRequestException);
    },
  );
});
