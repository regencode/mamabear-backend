import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomLoggerModule } from './common/logger/logger.module';
import { MailHogOptions } from './options/mailhog.options';
import { CategoryModule } from './category/category.module';
import { UploadModule } from './upload/upload.module';
import { ReviewsModule } from './reviews/reviews.module';
import { HighlightsModule } from './highlights/highlights.module';
import { DiscountsModule } from './discounts/discounts.module';
import { VariantModule } from './variant/variant.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CustomLoggerModule,
    MailerModule.forRoot(MailHogOptions),
    PrismaModule,
    ProductsModule,
    UsersModule,
    AuthModule,
    HealthModule,
    CategoryModule,
    UploadModule,
    ReviewsModule,
    HighlightsModule,
    ReviewsModule,
    DiscountsModule,
    VariantModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
