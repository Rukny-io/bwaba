import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IdentityVerificationService, SubmitIdentityDto } from './identity-verification.service';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { CurrentUser } from '../../core/common/decorators/auth/current-user.decorator';
import { AuthenticatedUser } from '../../core/common/decorators/auth/current-user.decorator';
import { Request } from 'express';

@ApiTags('Auth - Identity Verification')
@Controller('auth/identity')
export class IdentityVerificationController {
  constructor(private readonly identityService: IdentityVerificationService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get identity verification status' })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully' })
  async getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.identityService.getStatus(user.id);
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit identity verification documents' })
  @ApiResponse({ status: 201, description: 'Documents submitted for review' })
  async submitVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitIdentityDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.identityService.submitVerification(user.id, dto, ipAddress, userAgent);
  }
}
