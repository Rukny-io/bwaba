import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import { ApiKeyAuthGuard } from '../developer/api-keys/guards/api-key-auth.guard';
import { SendRuknyOtpDto } from './dto/send-rukny-otp.dto';
import { RuknyOtpService } from './rukny-otp.service';

type RuknyOtpRequest = {
  userId: string;
  apiKeyId: string;
  apiKey?: { developerAppId: string | null };
};

@Public()
@ApiTags('Rukny OTP')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(ApiKeyAuthGuard)
@Controller({ path: 'otp', version: '1' })
export class RuknyOtpController {
  constructor(private readonly ruknyOtp: RuknyOtpService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send OTP on WhatsApp (Rukny-managed sender)' })
  send(@Req() req: RuknyOtpRequest, @Body() dto: SendRuknyOtpDto) {
    const developerAppId = req.apiKey?.developerAppId;
    if (!developerAppId) {
      throw new ForbiddenException(
        'API key must be linked to a developer app.',
      );
    }
    return this.ruknyOtp.send(req.userId, req.apiKeyId, developerAppId, dto);
  }
}
