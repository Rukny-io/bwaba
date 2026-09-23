import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../core/common/guards/roles.guard';
import { Roles } from '../../core/common/decorators/auth/roles.decorator';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { CheckoutSessionGuard } from '../../core/common/guards/auth/checkout-session.guard';
import { MailSubscriptionsService } from './mail-subscriptions.service';
import {
  AdminActivateMailSubscriptionDto,
  BuyMailOutboundPackDto,
  PayMailSubscriptionDto,
  RequestMailSubscriptionDto,
  SendMailInvoiceDto,
} from './dto/mail-subscription.dto';

@ApiTags('Mail - Subscription')
@Controller({ path: 'mail', version: '1' })
export class MailSubscriptionsController {
  constructor(private readonly mailSubscriptions: MailSubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Mail pricing plans (IQD)' })
  getPlans() {
    return this.mailSubscriptions.getPlansOverview();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('apps/:appId/subscription')
  @ApiOperation({
    summary: 'Mail subscription for this app only (not shared across apps)',
  })
  getSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.mailSubscriptions.getOwnedAppSubscription(user.id, appId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('apps/:appId/usage')
  @ApiOperation({ summary: 'Outbound email usage and pack pricing for this app' })
  getUsage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.mailSubscriptions.getOutboundUsage(user.id, appId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @Post('apps/:appId/usage/packs/checkout-session')
  @ApiOperation({
    summary: 'Create checkout session for prepaid outbound email packs',
  })
  createOutboundPackCheckout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: BuyMailOutboundPackDto,
  ) {
    return this.mailSubscriptions.createOutboundPackCheckoutSession(
      user.id,
      appId,
      dto.thousands,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 8, ttl: 900_000 } })
  @Post('apps/:appId/subscription/request')
  @ApiOperation({
    summary:
      'Open a billing support ticket so an admin can activate this app’s plan',
  })
  requestPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: RequestMailSubscriptionDto,
  ) {
    return this.mailSubscriptions.requestPlan(
      user.id,
      appId,
      dto.plan,
      dto.mailboxCount,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @Post('apps/:appId/subscription/pay')
  @ApiOperation({
    summary: 'Start Al-Qaseh card payment for this Mail app plan',
  })
  payPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: PayMailSubscriptionDto,
  ) {
    return this.mailSubscriptions.initiateCardPayment(
      user.id,
      appId,
      dto.plan,
      dto.mailboxCount,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @Post('apps/:appId/subscription/checkout-session')
  @ApiOperation({
    summary:
      'Create a Mail → apps/checkout session (Starter + upgrades; no free passage)',
  })
  createCheckoutSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: PayMailSubscriptionDto,
  ) {
    return this.mailSubscriptions.createCheckoutSession(
      user.id,
      appId,
      dto.plan,
      dto.mailboxCount,
    );
  }

  @Public()
  @Get('checkout-sessions/:sessionId')
  @ApiOperation({ summary: 'Public Mail checkout session preview' })
  getCheckoutSession(@Param('sessionId') sessionId: string) {
    return this.mailSubscriptions.getCheckoutSessionPublic(sessionId);
  }

  @Public()
  @ApiBearerAuth()
  @UseGuards(CheckoutSessionGuard)
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @Post('checkout-sessions/:sessionId/pay')
  @ApiOperation({
    summary: 'Pay a Mail checkout session after verified checkout OTP',
  })
  payCheckoutSession(
    @Param('sessionId') sessionId: string,
    @Req() req: { checkoutSession?: Record<string, unknown> },
  ) {
    const session = req.checkoutSession || {};
    return this.mailSubscriptions.payCheckoutSession(sessionId, {
      verified: session.verified === true,
      userId: typeof session.userId === 'string' ? session.userId : undefined,
      phoneNumber:
        typeof session.phoneNumber === 'string'
          ? session.phoneNumber
          : undefined,
      email: typeof session.email === 'string' ? session.email : undefined,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('apps/:appId/subscription/payments/:paymentId')
  @ApiOperation({ summary: 'Check Mail card payment status' })
  paymentStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.mailSubscriptions.getCardPaymentStatus(
      user.id,
      appId,
      paymentId,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 900_000 } })
  @Get('apps/:appId/subscription/payments/:paymentId/invoice')
  @ApiOperation({
    summary: 'Issue / download a PDF invoice for a completed Mail payment',
  })
  async paymentInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('paymentId') paymentId: string,
    @Res() res: Response,
  ) {
    const invoice = await this.mailSubscriptions.issuePaymentInvoice(
      user.id,
      appId,
      paymentId,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoice.filename}"`,
    );
    res.setHeader('X-Invoice-Number', invoice.invoiceNumber);
    res.send(invoice.buffer);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 12, ttl: 900_000 } })
  @Get('apps/:appId/subscription/invoice')
  @ApiOperation({
    summary:
      'Issue / download a PDF invoice for the current active Mail subscription period',
  })
  async currentPeriodInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Res() res: Response,
  ) {
    const invoice = await this.mailSubscriptions.issueCurrentPeriodInvoice(
      user.id,
      appId,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoice.filename}"`,
    );
    res.setHeader('X-Invoice-Number', invoice.invoiceNumber);
    res.send(invoice.buffer);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @Post('apps/:appId/subscription/payments/:paymentId/send-invoice')
  @ApiOperation({
    summary: 'Send Mail payment invoice by email and/or WhatsApp',
  })
  sendPaymentInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: SendMailInvoiceDto,
  ) {
    return this.mailSubscriptions.sendPaymentInvoiceForUser(
      user.id,
      appId,
      paymentId,
      dto.channels,
    );
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 900_000 } })
  @Get('invoices/download')
  @ApiOperation({ summary: 'Public signed Mail invoice PDF download' })
  async downloadInvoiceByToken(
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const invoice = await this.mailSubscriptions.downloadInvoiceByToken(
      token || '',
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoice.filename}"`,
    );
    res.setHeader('X-Invoice-Number', invoice.invoiceNumber);
    res.send(invoice.buffer);
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 900_000 } })
  @Get('payments/:paymentId/invoice-delivery')
  @ApiOperation({
    summary: 'Public Mail invoice delivery status (signed token)',
  })
  invoiceDeliveryStatus(
    @Param('paymentId') paymentId: string,
    @Query('token') token: string,
  ) {
    return this.mailSubscriptions.getInvoiceDeliveryStatusByToken(
      paymentId,
      token || '',
    );
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 900_000 } })
  @Get('payments/:paymentId/public-status')
  @ApiOperation({
    summary: 'Public Mail payment status for checkout pending poll (signed token)',
  })
  publicPaymentStatus(
    @Param('paymentId') paymentId: string,
    @Query('token') token: string,
  ) {
    return this.mailSubscriptions.getPublicPaymentStatusByToken(
      paymentId,
      token || '',
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/users/:userId/apps')
  @ApiOperation({ summary: 'Admin: list Mail apps and per-app subscriptions' })
  adminListUserApps(@Param('userId') userId: string) {
    return this.mailSubscriptions.adminListUserApps(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/apps/:appId/subscription')
  @ApiOperation({
    summary: 'Admin: activate Mail plan + seats + storage for one app',
  })
  adminActivate(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: AdminActivateMailSubscriptionDto,
  ) {
    return this.mailSubscriptions.adminActivateForApp(
      admin.id,
      appId,
      dto.plan,
      dto.mailboxCount,
      dto.billingCycle,
      dto.ticketId,
    );
  }
}
