import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { CurrentUser } from '../../../core/common/decorators/auth/current-user.decorator';
import { EmailApiTryInput, EmailApiTryService } from './email-api-try.service';

class EmailApiTryDto implements EmailApiTryInput {
  @IsString() @Matches(/^\d{16}$/) appId!: string;
  @IsString() @Matches(/^\d{6,8}$/) apiKeySlug!: string;
  @IsEmail() @MaxLength(254) from!: string;
  @IsEmail() @MaxLength(254) to!: string;
  @IsString() @MinLength(1) @MaxLength(255) subject!: string;
  @IsString() @MinLength(1) @MaxLength(10_000) bodyText!: string;
}

@ApiTags('Developer - Email API Try')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'developer/email/api-try', version: '1' })
export class EmailApiTryController {
  constructor(private readonly tryService: EmailApiTryService) {}

  @Post()
  execute(@CurrentUser('id') userId: string, @Body() dto: EmailApiTryDto) {
    return this.tryService.execute(userId, dto);
  }
}
