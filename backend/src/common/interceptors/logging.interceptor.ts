import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const now = Date.now();

    // Attach request ID for log correlation; honour X-Request-Id if provided by upstream proxy
    const requestId: string =
      (request.headers['x-request-id'] as string) || randomUUID();
    request.requestId = requestId;

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const delay = Date.now() - now;

        this.logger.log(
          `${method} ${url} ${statusCode} - ${delay}ms [${requestId}]`,
          {
            requestId,
            body: method !== 'GET' ? body : undefined,
            query,
            params,
          }
        );
      })
    );
  }
}
