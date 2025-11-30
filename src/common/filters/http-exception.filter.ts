import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ErrorLogService } from '../../audit/services/error-log.service';

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly errorLogService: ErrorLogService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorDetails = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message,
      stack: exception instanceof Error ? exception.stack : undefined,
      userId: request.user?.userId,
    };

    if (status >= 500 || !(exception instanceof HttpException)) {
      await this.errorLogService.record({
        context: 'HTTP_EXCEPTION',
        message:
          typeof message === 'string'
            ? message
            : JSON.stringify((message as any).message || message),
        stack: exception instanceof Error ? exception.stack : undefined,
        metadata: {
          statusCode: status,
          path: request.url,
          method: request.method,
          userId: request.user?.userId,
        },
      });
    }

    response.status(status).json({
      statusCode: status,
      message:
        typeof message === 'string'
          ? message
          : (message as any).message || 'An error occurred',
      timestamp: errorDetails.timestamp,
      path: request.url,
    });
  }
}

