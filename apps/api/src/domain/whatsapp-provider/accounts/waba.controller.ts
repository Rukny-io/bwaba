import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../../core/common/decorators/auth/current-user.decorator';
import { WabaService } from './waba.service';
import { ConnectWabaDto } from './dto/connect-waba.dto';
import { TemplatesService } from '../templates/templates.service';
import { CreateTemplateDto } from '../templates/dto/template.dto';
import {
  CreateTemplateFromLibraryDto,
  TemplateLibraryQueryDto,
} from '../templates/dto/template-library.dto';

@ApiTags('Developer - WhatsApp Accounts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'developer/whatsapp', version: '1' })
export class WabaController {
  constructor(
    private readonly wabaService: WabaService,
    private readonly templatesService: TemplatesService,
  ) {}

  @Get('embedded-signup-config')
  @ApiOperation({ summary: 'الحصول على إعدادات Embedded Signup' })
  getEmbeddedSignupConfig() {
    return this.wabaService.getEmbeddedSignupConfig();
  }

  @Post('connect')
  @ApiOperation({ summary: 'ربط حساب WABA عبر Embedded Signup' })
  connect(@CurrentUser('id') userId: string, @Body() dto: ConnectWabaDto) {
    return this.wabaService.connect(userId, dto);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'قائمة حسابات WABA' })
  findAll(@CurrentUser('id') userId: string, @Query('appId') appId: string) {
    return this.wabaService.findAll(userId, appId);
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'فك ارتباط حساب WABA' })
  disconnect(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('appId') appId: string,
  ) {
    return this.wabaService.disconnect(userId, appId, id);
  }

  @Post('accounts/:id/refresh')
  @ApiOperation({ summary: 'تحديث حالة WABA (مزامنة مع Meta)' })
  refresh(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('appId') appId: string,
  ) {
    return this.wabaService.refresh(userId, appId, id);
  }

  // ─── Templates (Developer JWT) ──────────────────────────

  @Get('templates')
  @ApiOperation({ summary: 'قائمة قوالب الرسائل' })
  getTemplates(
    @CurrentUser('id') userId: string,
    @Query('appId') appId: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.templatesService.findAll(userId, appId, accountId);
  }

  @Post('templates')
  @ApiOperation({ summary: 'إنشاء قالب جديد' })
  createTemplate(
    @CurrentUser('id') userId: string,
    @Query('appId') appId: string,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.templatesService.create(userId, appId, dto);
  }

  @Get('template-library')
  @ApiOperation({ summary: 'مكتبة قوالب Meta الجاهزة' })
  getTemplateLibrary(
    @CurrentUser('id') userId: string,
    @Query('appId') appId: string,
    @Query('accountId') accountId?: string,
    @Query('search') search?: string,
    @Query('topic') topic?: string,
    @Query('usecase') usecase?: string,
    @Query('industry') industry?: string,
    @Query('language') language?: string,
    @Query('name') name?: string,
    @Query('after') after?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const query: TemplateLibraryQueryDto = {
      search,
      topic,
      usecase,
      industry,
      language,
      name,
      after,
      limit,
    };
    return this.templatesService.browseLibrary(userId, appId, query, accountId);
  }

  @Post('templates/from-library')
  @ApiOperation({ summary: 'إنشاء قالب من مكتبة Meta' })
  createTemplateFromLibrary(
    @CurrentUser('id') userId: string,
    @Query('appId') appId: string,
    @Body() dto: CreateTemplateFromLibraryDto,
  ) {
    return this.templatesService.createFromLibrary(userId, appId, dto);
  }

  @Post('templates/sync')
  @ApiOperation({ summary: 'مزامنة القوالب مع Meta' })
  syncTemplates(
    @CurrentUser('id') userId: string,
    @Query('appId') appId: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.templatesService.syncTemplates(userId, appId, accountId);
  }

  @Delete('templates/:name')
  @ApiOperation({ summary: 'حذف قالب' })
  deleteTemplate(
    @CurrentUser('id') userId: string,
    @Param('name') name: string,
    @Query('appId') appId: string,
  ) {
    return this.templatesService.remove(userId, appId, name);
  }
}
