import { Module } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { MetricsService } from './metrics.service';

/**
 * Monitoring utilities (metrics services). Not registered in AppModule —
 * health endpoints live in core/health. Import this module only when wiring
 * MetricsInterceptor or Prometheus export explicitly.
 */
@Module({
  providers: [MonitoringService, MetricsService],
  exports: [MonitoringService, MetricsService],
})
export class MonitoringModule {}
