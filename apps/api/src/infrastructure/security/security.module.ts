import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SecurityLogService } from './log.service';
import { SecurityDetectorService } from './detector.service';
import { SecurityGateway } from './security.gateway';
import { SessionFingerprintService } from './session-fingerprint.service';
import { AnomalyDetectionService } from './anomaly-detection.service';
import { BruteForceService } from './brute-force.service';
import { ThreatAlertService } from './threat-alert.service';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { EmailModule } from '../../integrations/email/email.module';
import { RedisModule } from '../../core/cache/redis.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    SecurityLogService,
    SecurityDetectorService,
    SecurityGateway,
    SessionFingerprintService,
    AnomalyDetectionService,
    BruteForceService,
    ThreatAlertService,
  ],
  exports: [
    SecurityLogService,
    SecurityDetectorService,
    SecurityGateway,
    SessionFingerprintService,
    AnomalyDetectionService,
    BruteForceService,
    ThreatAlertService,
  ],
})
export class SecurityModule {}
