import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MailFilterRuleType } from '@prisma/client';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import {
  CreateMailFilterRuleDto,
  UpdateMailFilterRuleDto,
  UpdateMailSecuritySettingsDto,
} from './dto/mail-filter-rule.dto';
import { MailFilterRulesService } from './mail-filter-rules.service';

@ApiTags('Mail - Filter rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'mail/apps/:appId', version: '1' })
export class MailFilterRulesController {
  constructor(private readonly filterRules: MailFilterRulesService) {}

  @Get('filter-rules')
  @ApiOperation({ summary: 'List filter rules for a Mail app' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Query('ruleType') ruleType?: MailFilterRuleType,
  ) {
    return this.filterRules.list(user.id, appId, ruleType);
  }

  @Post('filter-rules')
  @ApiOperation({ summary: 'Create a filter rule' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: CreateMailFilterRuleDto,
  ) {
    return this.filterRules.create(user.id, appId, dto);
  }

  @Patch('filter-rules/:ruleId')
  @ApiOperation({ summary: 'Update a filter rule' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateMailFilterRuleDto,
  ) {
    return this.filterRules.update(user.id, appId, ruleId, dto);
  }

  @Delete('filter-rules/:ruleId')
  @ApiOperation({ summary: 'Delete a filter rule' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return this.filterRules.remove(user.id, appId, ruleId);
  }

  @Get('security-settings')
  @ApiOperation({ summary: 'Get workspace security settings' })
  getSecuritySettings(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.filterRules.getSecuritySettings(user.id, appId);
  }

  @Patch('security-settings')
  @ApiOperation({ summary: 'Update workspace security settings' })
  updateSecuritySettings(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: UpdateMailSecuritySettingsDto,
  ) {
    return this.filterRules.updateSecuritySettings(user.id, appId, dto);
  }
}
