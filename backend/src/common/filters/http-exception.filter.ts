import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: string | null = null;
    let fields: Array<{field: string, message: string}> | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = res.message || exception.message;
      error = res.error || exception.name;

      if (Array.isArray(res.message)) {
        message = 'Validation failed';
        fields = res.message.map((msg: string) => ({ field: 'unknown', message: msg }));
      }
    } else if (exception instanceof Error) {
      error = exception.name;
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      data: null,
      error,
      fields,
    });
  }
}
