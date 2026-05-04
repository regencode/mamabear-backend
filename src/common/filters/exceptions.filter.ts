import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomResponse } from '../CustomResponse';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const responseJson : CustomResponse<null> = {
        success: false,
        statusCode: status,
        message: exception.message || "No message specified",
        data: null,
        timestamp: new Date().toISOString(),
    };

    response.status(status).json(responseJson);
  }
}
