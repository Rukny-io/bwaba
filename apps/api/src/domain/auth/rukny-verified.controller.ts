import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import {
  RuknyVerifiedService,
  SubmitRuknyVerifiedDto,
} from './rukny-verified.service';

@ApiTags('Auth - Rukny Verified')
@Controller('auth/verified')
export class RuknyVerifiedController {
  constructor(private readonly verifiedService: RuknyVerifiedService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get Rukny Verified badge status' })
  async getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.verifiedService.getStatus(user.id);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Apply for Rukny Verified blue badge' })
  @ApiResponse({ status: 201, description: 'Application submitted' })
  async apply(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitRuknyVerifiedDto,
    @Req() req: Request,
  ) {
    return this.verifiedService.submitApplication(
      user.id,
      dto,
      req.ip || req.socket.remoteAddress,
      req.headers['user-agent'],
    );
  }
}
