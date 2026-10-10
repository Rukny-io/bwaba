import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MetaPortfolioService } from './meta-portfolio.service';
import { SubmitMetaPortfolioRequestDto } from './dto/submit-meta-portfolio-request.dto';
import { WorkspaceGuard } from '../../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../../workspace/workspace-context.middleware';

@ApiTags('Developer - Meta Portfolio')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceGuard)
@Controller({ path: 'developer/meta-portfolio', version: '1' })
export class MetaPortfolioController {
  constructor(private readonly metaPortfolio: MetaPortfolioService) {}

  @Get('status')
  @RequiresWorkspacePermission('developer:apps:read')
  @ApiOperation({
    summary: 'حالة طلب حافظة أعمال Meta + أهلية Pro + تعريف الحقول',
  })
  getStatus(@ActiveWorkspace() ws: WorkspaceContext) {
    return this.metaPortfolio.getStatus(ws.ownerId);
  }

  @Post('requests')
  @RequiresWorkspacePermission('developer:subscription:write')
  @ApiOperation({ summary: 'تقديم طلب حافظة أعمال Meta (Pro فقط)' })
  submit(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() dto: SubmitMetaPortfolioRequestDto,
  ) {
    if (!ws.isOwner) {
      throw new ForbiddenException({
        message: 'Submitting a Meta portfolio request is limited to the account owner',
        code: 'OWNER_ONLY',
      });
    }
    return this.metaPortfolio.submit(ws.ownerId, dto);
  }
}
