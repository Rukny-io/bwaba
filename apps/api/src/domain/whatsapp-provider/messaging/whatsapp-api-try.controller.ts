import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsIn, IsObject, IsOptional, IsString, Matches } from 'class-validator';
import { CurrentUser } from '../../../core/common/decorators/auth/current-user.decorator';
import {
  WhatsappApiTryService,
  type WhatsappApiTryInput,
} from './whatsapp-api-try.service';

class WhatsappApiTryDto implements WhatsappApiTryInput {
  @IsString()
  @Matches(/^\d{16}$/)
  appId: string;

  @IsIn(['GET', 'POST', 'DELETE'])
  method: 'GET' | 'POST' | 'DELETE';

  @IsString()
  path: string;

  @IsOptional()
  @IsObject()
  body?: unknown;

  @IsString()
  @Matches(/^\d{6,8}$/)
  apiKeySlug: string;
}

@ApiTags('Developer - WhatsApp API Try')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'developer/whatsapp/api-try', version: '1' })
export class WhatsappApiTryController {
  constructor(private readonly tryService: WhatsappApiTryService) {}

  @Post()
  @ApiOperation({
    summary: 'Proxy Try-it requests using a test API key (server-side only)',
  })
  execute(@CurrentUser('id') userId: string, @Body() dto: WhatsappApiTryDto) {
    return this.tryService.execute(userId, dto);
  }
}
