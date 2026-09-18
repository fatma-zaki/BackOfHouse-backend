import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { isValidUUID } from '../utils/uuid.util';
import { BadRequestException } from '../exceptions/business.exceptions';
import { UUID } from '../types';

/**
 * Validates route/query identifiers before they reach a service.
 * Rejecting malformed ids early keeps object lookups predictable and stops
 * probing traffic from reaching the database.
 */
@Injectable()
export class ParseUuidPipe implements PipeTransform<string, UUID> {
  transform(value: string, metadata: ArgumentMetadata): UUID {
    if (typeof value !== 'string' || !isValidUUID(value)) {
      const name = metadata.data ?? 'identifier';
      throw new BadRequestException(`${name} must be a valid UUID`);
    }
    return value;
  }
}
