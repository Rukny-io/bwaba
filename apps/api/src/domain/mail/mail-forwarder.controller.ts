import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import {
  CreateMailForwarderDto,
  UpdateMailForwarderDto,
} from './dto/mail-forwarder.dto';
import { MailForwarderService } from './mail-forwarder.service';

@ApiTags('Mail - Forwarders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'mail/apps/:appId/forwarders', version: '1' })
export class MailForwarderController {
  constructor(private readonly forwarders: MailForwarderService) {}

  @Get()
  @ApiOperation({ summary: 'List forwarding rules for a Mail app' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.forwarders.list(user.id, appId);
  }

  @Post()
  @ApiOperation({ summary: 'Forward a mailbox to an external address' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: CreateMailForwarderDto,
  ) {
    return this.forwarders.create(user.id, appId, dto);
  }

  @Patch(':forwarderId')
  @ApiOperation({ summary: 'Update a forwarding rule' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('forwarderId') forwarderId: string,
    @Body() dto: UpdateMailForwarderDto,
  ) {
    return this.forwarders.update(user.id, appId, forwarderId, dto);
  }

  @Delete(':forwarderId')
  @ApiOperation({ summary: 'Delete a forwarding rule' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('forwarderId') forwarderId: string,
  ) {
    return this.forwarders.remove(user.id, appId, forwarderId);
  }
}
