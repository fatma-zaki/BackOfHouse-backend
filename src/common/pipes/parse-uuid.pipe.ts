import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ValidationFailedError } from '../errors';
import { isUuid } from '../ids/uuid-v7';

/** Rejects malformed ids in route parameters before they reach a service. */
@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (typeof value !== 'string' || !isUuid(value)) {
      const field = metadata.data ?? 'id';
      throw new ValidationFailedError({ [field]: ['must be a UUID'] });
    }
    return value.toLowerCase();
  }
}
