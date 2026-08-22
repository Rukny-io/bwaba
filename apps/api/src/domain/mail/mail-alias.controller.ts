import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import {
  CreateMailAliasDto,
  UpdateMailAliasDto,
} from './dto/mail-alias.dto';
import { MailAliasService } from './mail-alias.service';

@ApiTags('Mail - Aliases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'mail/apps/:appId/aliases', version: '1' })
export class MailAliasController {
  constructor(private readonly aliases: MailAliasService) {}

  @Get()
  @ApiOperation({ summary: 'List email aliases for a Mail app' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.aliases.list(user.id, appId);
  }

  @Post()
  @ApiOperation({ summary: 'Create an email alias that delivers into a mailbox' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: CreateMailAliasDto,
  ) {
    return this.aliases.create(user.id, appId, dto);
  }

  @Patch(':aliasId')
  @ApiOperation({ summary: 'Update alias destination or enabled state' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('aliasId') aliasId: string,
    @Body() dto: UpdateMailAliasDto,
  ) {
    return this.aliases.update(user.id, appId, aliasId, dto);
  }

  @Delete(':aliasId')
  @ApiOperation({ summary: 'Delete an email alias' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('aliasId') aliasId: string,
  ) {
    return this.aliases.remove(user.id, appId, aliasId);
  }
}
