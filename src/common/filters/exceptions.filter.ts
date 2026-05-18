import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomResponse } from '../CustomResponse';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const responseJson: CustomResponse<null> = {
      success: false,
      statusCode: status,
      message: typeof exceptionResponse === 'string'
          ? [exceptionResponse]
          : (exceptionResponse as any).message || exception.message,

      data: null,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(responseJson);
  }
}
