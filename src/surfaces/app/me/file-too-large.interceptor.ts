import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { DomainError, ErrorCode } from '../../../common/errors';

/**
 * Put before FileInterceptor: an upload over the multer size limit answers 413
 * `FILE_TOO_LARGE` (contracts/app error catalog) instead of the generic `PAYLOAD_TOO_LARGE`.
 */
@Injectable()
export class FileTooLargeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next
      .handle()
      .pipe(
        catchError((error: unknown) =>
          throwError(() =>
            error instanceof PayloadTooLargeException
              ? new DomainError(ErrorCode.FILE_TOO_LARGE, 'Files are limited to 10 MB', HttpStatus.PAYLOAD_TOO_LARGE)
              : error,
          ),
        ),
      );
  }
}
