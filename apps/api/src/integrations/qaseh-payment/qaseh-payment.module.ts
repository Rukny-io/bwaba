import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { QasehPaymentService } from './qaseh-payment.service';
import { QasehPaymentController } from './qaseh-payment.controller';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { MailModule } from '../../domain/mail/mail.module';
import { DeveloperModule } from '../../domain/developer/developer.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    forwardRef(() => MailModule),
    forwardRef(() => DeveloperModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [QasehPaymentController],
  providers: [QasehPaymentService],
  exports: [QasehPaymentService],
})
export class QasehPaymentModule {}
