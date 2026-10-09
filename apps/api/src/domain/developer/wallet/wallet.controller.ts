import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  GoneException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';
import {
  AllocateAppBalanceDto,
  UpdateAutoRechargeDto,
  UpdateLowBalanceAlertDto,
} from './dto/wallet.dto';
import { WorkspaceGuard } from '../../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../../workspace/workspace-context.middleware';

function assertOwner(ws: WorkspaceContext): void {
  if (!ws.isOwner) {
    throw new ForbiddenException({
      message: 'العمليات المالية تقتصر على مالك الحساب',
      code: 'OWNER_ONLY',
    });
  }
}

@ApiTags('Developer - Wallet')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceGuard)
@Controller({ path: 'developer/wallet', version: '1' })
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @RequiresWorkspacePermission('developer:wallet:read')
  @ApiOperation({ summary: 'الحصول على المحفظة' })
  getWallet(@ActiveWorkspace() ws: WorkspaceContext) {
    return this.walletService.getWallet(ws.ownerId);
  }

  @Get('apps/:appId')
  @RequiresWorkspacePermission('developer:wallet:read')
  @ApiOperation({ summary: 'الحصول على رصيد تطبيق محدد' })
  getAppWallet(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('appId') appId: string,
  ) {
    return this.walletService.getAppWallet(ws.ownerId, appId);
  }

  @Post('apps/:appId/allocate')
  @RequiresWorkspacePermission('developer:wallet:write')
  @ApiOperation({ summary: 'تحويل رصيد من المحفظة الرئيسية إلى التطبيق' })
  allocateToApp(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('appId') appId: string,
    @Body() dto: AllocateAppBalanceDto,
  ) {
    assertOwner(ws);
    return this.walletService.allocateToApp(ws.ownerId, appId, dto.amount);
  }

  @Post('top-up')
  @ApiOperation({ summary: 'شحن الرصيد (مالك الحساب فقط)' })
  topUp(
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    assertOwner(ws);
    // A pending ledger record must never be creditable by a browser request.
    // All wallet top-ups now start at the authenticated checkout-session route.
    throw new GoneException({
      code: 'WALLET_TOPUP_LEGACY_ENDPOINT_DISABLED',
      message: 'Use POST /developer/checkout-session to start a wallet top-up.',
    });
  }

  @Post('top-up/:transactionId/verify')
  @ApiOperation({ summary: 'تأكيد الشحن بعد الدفع (مالك الحساب فقط)' })
  verifyTopUp(
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    assertOwner(ws);
    // Credit is performed only by the Qaseh webhook/callback after an
    // authoritative gateway status and amount check.
    throw new GoneException({
      code: 'WALLET_TOPUP_BROWSER_VERIFICATION_DISABLED',
      message: 'Wallet top-ups are verified by the payment gateway.',
    });
  }

  @Get('transactions')
  @RequiresWorkspacePermission('developer:wallet:read')
  @ApiOperation({ summary: 'قائمة المعاملات' })
  getTransactions(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getTransactions(ws.ownerId, {
      type,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('auto-recharge')
  @RequiresWorkspacePermission('developer:wallet:read')
  @ApiOperation({ summary: 'إعدادات الشحن التلقائي' })
  getAutoRecharge(@ActiveWorkspace() ws: WorkspaceContext) {
    return this.walletService.getAutoRecharge(ws.ownerId);
  }

  @Patch('auto-recharge')
  @ApiOperation({ summary: 'تحديث إعدادات الشحن التلقائي (مالك الحساب فقط)' })
  updateAutoRecharge(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() dto: UpdateAutoRechargeDto,
  ) {
    assertOwner(ws);
    return this.walletService.updateAutoRecharge(ws.ownerId, dto);
  }

  @Patch('low-balance-alert')
  @RequiresWorkspacePermission('developer:wallet:write')
  @ApiOperation({ summary: 'تحديث تنبيه انخفاض الرصيد' })
  updateLowBalanceAlert(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() dto: UpdateLowBalanceAlertDto,
  ) {
    return this.walletService.updateLowBalanceAlert(ws.ownerId, dto);
  }

  @Get('pricing')
  @ApiOperation({ summary: 'أسعار الرسائل' })
  getPricing() {
    return this.walletService.getPricing();
  }
}
