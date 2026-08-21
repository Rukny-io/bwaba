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
import { MailAppsService } from './mail-apps.service';
import {
  CreateMailAppDto,
  SendMailAppOtpDto,
  UpdateMailAppDto,
  VerifyMailAppOtpDto,
} from './dto/mail-app.dto';

@ApiTags('Mail - Apps')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'mail/apps', version: '1' })
export class MailAppsController {
  constructor(private readonly mailApps: MailAppsService) {}

  @Get()
  @ApiOperation({ summary: 'List Mail apps for the signed-in user' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.mailApps.listApps(user.id);
  }

  @Post('otp/send')
  @ApiOperation({ summary: 'Send WhatsApp OTP for Mail app creation' })
  sendOtp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMailAppOtpDto,
  ) {
    return this.mailApps.sendOtp(user.id, dto);
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify WhatsApp OTP for Mail app creation' })
  verifyOtp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyMailAppOtpDto,
  ) {
    return this.mailApps.verifyOtpEndpoint(user.id, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a Mail app (requires verified OTP)' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMailAppDto,
  ) {
    return this.mailApps.createApp(user.id, dto);
  }

  @Get(':appId')
  @ApiOperation({ summary: 'Get one Mail app' })
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.mailApps.getApp(user.id, appId);
  }

  @Patch(':appId')
  @ApiOperation({ summary: 'Update a Mail app' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: UpdateMailAppDto,
  ) {
    return this.mailApps.updateApp(user.id, appId, dto);
  }

  @Delete(':appId')
  @ApiOperation({ summary: 'Archive a Mail app' })
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.mailApps.archiveApp(user.id, appId);
  }
}
