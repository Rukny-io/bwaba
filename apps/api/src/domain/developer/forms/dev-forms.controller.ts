import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrentUser } from '../../../core/common/decorators/auth/current-user.decorator';
import { DevFormsService } from './dev-forms.service';
import { LinkFormToAppDto, UpdateEmbedOriginsDto } from './dto/dev-forms.dto';

@ApiTags('Developer - Forms')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'developer/forms', version: '1' })
export class DevFormsController {
  constructor(private readonly devForms: DevFormsService) {}

  @Get('summary')
  @SkipThrottle()
  @ApiOperation({ summary: 'ملخص نماذج مرتبطة بتطبيق المطوّر' })
  getSummary(
    @CurrentUser('id') userId: string,
    @Query('appId') appId: string,
  ) {
    return this.devForms.getSummary(userId, appId);
  }

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'النماذج المرتبطة بالتطبيق' })
  listLinked(
    @CurrentUser('id') userId: string,
    @Query('appId') appId: string,
  ) {
    return this.devForms.listLinked(userId, appId);
  }

  @Get('available')
  @SkipThrottle()
  @ApiOperation({ summary: 'نماذج المستخدم المتاحة للربط' })
  listAvailable(
    @CurrentUser('id') userId: string,
    @Query('appId') appId: string,
  ) {
    return this.devForms.listAvailableToLink(userId, appId);
  }

  @Get(':formId')
  @SkipThrottle()
  @ApiOperation({ summary: 'تفاصيل نموذج مرتبط + إعدادات العرض' })
  getLinkedForm(
    @CurrentUser('id') userId: string,
    @Query('appId') appId: string,
    @Param('formId') formId: string,
  ) {
    return this.devForms.getLinkedForm(userId, appId, formId);
  }

  @Post('link')
  @ApiOperation({ summary: 'ربط نموذج بتطبيق المطوّر' })
  linkForm(
    @CurrentUser('id') userId: string,
    @Body() dto: LinkFormToAppDto,
  ) {
    return this.devForms.linkForm(userId, dto.appId, dto.formId);
  }

  @Delete(':formId/link')
  @ApiOperation({ summary: 'إلغاء ربط نموذج من التطبيق' })
  unlinkForm(
    @CurrentUser('id') userId: string,
    @Query('appId') appId: string,
    @Param('formId') formId: string,
  ) {
    return this.devForms.unlinkForm(userId, appId, formId);
  }

  @Patch('embed-origins')
  @ApiOperation({ summary: 'تحديث النطاقات المسموح بها لتضمين النماذج' })
  updateEmbedOrigins(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateEmbedOriginsDto,
  ) {
    return this.devForms.updateEmbedOrigins(
      userId,
      dto.appId,
      dto.allowedOrigins,
    );
  }
}
