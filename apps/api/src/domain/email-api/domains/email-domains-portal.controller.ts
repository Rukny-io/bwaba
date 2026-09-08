import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../core/common/decorators/auth/current-user.decorator';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { CreateEmailDomainDto } from './dto/create-email-domain.dto';
import { CreateEmailSenderDto } from './dto/create-email-sender.dto';
import { EmailDomainsService } from './email-domains.service';

/** Portal management API. It uses the user's JWT rather than an API key so
 * operators never need to paste a production secret into the browser. */
@ApiTags('Developer Portal - Email API')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'developer/apps/:appId/email', version: '1' })
export class EmailDomainsPortalController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly domains: EmailDomainsService,
  ) {}

  @Get('domains')
  async listDomains(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    await this.requireOwnedApp(user.id, appId);
    return this.domains.list(user.id);
  }

  @Post('domains')
  async createDomain(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: CreateEmailDomainDto,
  ) {
    await this.requireOwnedApp(user.id, appId);
    return this.domains.create(user.id, dto.domain);
  }

  @Get('domains/:domain')
  async getDomain(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('domain') domain: string,
  ) {
    await this.requireOwnedApp(user.id, appId);
    return this.domains.get(user.id, domain);
  }

  @Get('senders')
  async listSenders(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    const app = await this.requireOwnedApp(user.id, appId);
    return this.domains.listSenders(user.id, app.id);
  }

  @Post('senders')
  async createSender(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: CreateEmailSenderDto,
  ) {
    const app = await this.requireOwnedApp(user.id, appId);
    return this.domains.createSender(user.id, app.id, dto.email);
  }

  private async requireOwnedApp(userId: string, appId: string) {
    const app = await this.prisma.developerApp.findFirst({
      where: { userId, appId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!app) throw new NotFoundException('Developer app not found.');
    return app;
  }
}
