import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { UpsertMailCatchAllDto } from './dto/mail-catch-all.dto';
import { MailCatchAllService } from './mail-catch-all.service';

@ApiTags('Mail - Catch-all')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'mail/apps/:appId/catch-all', version: '1' })
export class MailCatchAllController {
  constructor(private readonly catchAll: MailCatchAllService) {}

  @Get()
  @ApiOperation({ summary: 'Get catch-all settings for a Mail app' })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.catchAll.get(user.id, appId);
  }

  @Put()
  @ApiOperation({
    summary: 'Enable or update catch-all delivery for unmatched addresses',
  })
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: UpsertMailCatchAllDto,
  ) {
    return this.catchAll.upsert(user.id, appId, dto);
  }
}
