import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../core/common/decorators/auth/public.decorator';
import { CheckoutSessionGuard } from '../../../core/common/guards/auth/checkout-session.guard';
import { WorkspaceGuard } from '../../workspace/workspace.guard';
import { ActiveWorkspace } from '../../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../../workspace/workspace-context.middleware';
import { DeveloperCheckoutService } from './developer-checkout.service';
import { CreateDeveloperCheckoutSessionDto } from './dto/developer-checkout.dto';

@ApiTags('Developer - Checkout')
@Controller({ path: 'developer', version: '1' })
export class DeveloperCheckoutController {
  constructor(private readonly checkout: DeveloperCheckoutService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), WorkspaceGuard)
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @Post('checkout-session')
  @ApiOperation({
    summary: 'Create Developers → apps/checkout session (wallet top-up or Pro)',
  })
  createCheckoutSession(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() dto: CreateDeveloperCheckoutSessionDto,
  ) {
    if (!ws.isOwner) {
      throw new ForbiddenException({
        message: 'العمليات المالية تقتصر على مالك الحساب',
        code: 'OWNER_ONLY',
      });
    }
    return this.checkout.createCheckoutSession(ws.ownerId, {
      kind: dto.kind,
      amount: dto.amount,
      billingCycle: dto.billingCycle,
      appId: dto.appId,
      planId: dto.planId,
    });
  }

  @Public()
  @Get('checkout-sessions/:sessionId')
  @ApiOperation({ summary: 'Public Developer checkout session preview' })
  getCheckoutSession(@Param('sessionId') sessionId: string) {
    return this.checkout.getCheckoutSessionPublic(sessionId);
  }

  @Public()
  @ApiBearerAuth()
  @UseGuards(CheckoutSessionGuard)
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @Post('checkout-sessions/:sessionId/pay')
  @ApiOperation({
    summary: 'Pay a Developer checkout session after verified checkout OTP',
  })
  payCheckoutSession(
    @Param('sessionId') sessionId: string,
    @Req() req: { checkoutSession?: Record<string, unknown> },
  ) {
    const session = req.checkoutSession || {};
    return this.checkout.payCheckoutSession(sessionId, {
      verified: session.verified === true,
      userId: typeof session.userId === 'string' ? session.userId : undefined,
      phoneNumber:
        typeof session.phoneNumber === 'string'
          ? session.phoneNumber
          : undefined,
      email: typeof session.email === 'string' ? session.email : undefined,
    });
  }
}
