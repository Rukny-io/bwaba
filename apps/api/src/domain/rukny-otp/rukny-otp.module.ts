import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { WhatsAppBusinessModule } from '../../integrations/whatsapp-business/whatsapp-business.module';
import { DeveloperModule } from '../developer/developer.module';
import { RuknyOtpController } from './rukny-otp.controller';
import { RuknyOtpService } from './rukny-otp.service';

@Module({
  imports: [
    PrismaModule,
    WhatsAppBusinessModule,
    forwardRef(() => DeveloperModule),
  ],
  controllers: [RuknyOtpController],
  providers: [RuknyOtpService],
})
export class RuknyOtpModule {}
