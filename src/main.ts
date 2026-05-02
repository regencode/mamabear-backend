import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  ValidationPipe,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

// Catch every thrown value and log it before delegating to NestJS defaults.
@Catch()
class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const ctx = host.switchToHttp();
    const request = ctx.getRequest<{ method: string; url: string }>();

    if (status >= 500) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `HTTP ${status} on ${request.method} ${request.url}: ${
          exception instanceof HttpException
            ? JSON.stringify(exception.getResponse())
            : String(exception)
        }`,
      );
    }

    super.catch(exception, host);
  }
}

async function bootstrap() {
  // Catch errors that escape the NestJS request pipeline entirely.
  process.on('uncaughtException', (error: Error) => {
    console.error('[uncaughtException] Process will exit:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    console.error('[unhandledRejection] Unhandled promise rejection:', reason);
  });

  const app = await NestFactory.create(AppModule);

  // Register the global exception filter after the app is created so we have
  // access to the underlying HTTP adapter required by BaseExceptionFilter.
  const { HttpAdapterHost } = await import('@nestjs/core');
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost.httpAdapter));

  app.enableCors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
      new ValidationPipe({
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: true,
      }),
  );

  const config = new DocumentBuilder()
    .setTitle('MamaBear API')
    .setDescription('MamaBear Backend API Documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Application listening on port ${port}`, 'Bootstrap');
}
bootstrap();
