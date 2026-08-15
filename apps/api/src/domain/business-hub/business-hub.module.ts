import { Module } from '@nestjs/common';
import { BusinessWorkflowsController } from './workflows/workflows.controller';
import { BusinessWorkflowsService } from './workflows/workflows.service';

@Module({
  controllers: [BusinessWorkflowsController],
  providers: [BusinessWorkflowsService],
})
export class BusinessHubModule {}
