import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomResponse } from '../CustomResponse';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const responseJson: CustomResponse<null> = {
        success: false,
        statusCode: status,
        message: typeof exceptionResponse === 'string'
            ? [exceptionResponse]
            : Array.isArray((exceptionResponse as any).message)
              ? (exceptionResponse as any).message
              : [(exceptionResponse as any).message || exception.message],
        data: null,
        timestamp: new Date().toISOString(),
      };
      response.status(status).json(responseJson);
    } else {
      const responseJson: CustomResponse<null> = {
        success: false,
        statusCode: 500,
        message: ['Internal server error'],
        data: null,
        timestamp: new Date().toISOString(),
      };
      response.status(500).json(responseJson);
    }
  }
}
