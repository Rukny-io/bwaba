import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../core/common/decorators/auth/current-user.decorator';
import { EmailAutomationService } from './email-automation.service';

class CreateAutomationDto {
  name!: string;
  triggerType?: string;
  actionType?: string;
  configJson?: Record<string, unknown>;
}

@ApiTags('Developer Portal - Email API automations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'developer/email/automations', version: '1' })
export class EmailAutomationController {
  constructor(private readonly automations: EmailAutomationService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.automations.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAutomationDto,
  ) {
    return this.automations.create(user.id, dto);
  }

  @Post(':id/run')
  run(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.automations.run(user.id, id);
  }
}
