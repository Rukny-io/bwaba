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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';
import {
  AllocateAppBalanceDto,
  TopUpWalletDto,
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
    return this.walletService.allocateToApp(ws.ownerId, appId, dto.amount);
  }

  @Post('top-up')
  @ApiOperation({ summary: 'شحن الرصيد (مالك الحساب فقط)' })
  topUp(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() dto: TopUpWalletDto,
  ) {
    assertOwner(ws);
    return this.walletService.topUp(ws.ownerId, dto);
  }

  @Post('top-up/:transactionId/verify')
  @ApiOperation({ summary: 'تأكيد الشحن بعد الدفع (مالك الحساب فقط)' })
  verifyTopUp(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('transactionId') transactionId: string,
  ) {
    assertOwner(ws);
    return this.walletService.verifyTopUp(ws.ownerId, transactionId);
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
