import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../core/common/decorators/auth/public.decorator';
import { ApiKeyAuthGuard } from '../../developer/api-keys/guards/api-key-auth.guard';
import { RequireScopes } from '../../developer/api-keys/decorators/require-scopes.decorator';
import { ContactsService } from '../../developer/contacts/contacts.service';
import { CreateContactDto } from '../../developer/contacts/dto/create-contact.dto';
import { UpdateContactDto } from '../../developer/contacts/dto/update-contact.dto';

@Public()
@ApiTags('WhatsApp API - Contacts')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(ApiKeyAuthGuard)
@Controller({ path: 'whatsapp/contacts', version: '1' })
export class ContactsApiController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @RequireScopes('contacts:write')
  @ApiOperation({ summary: 'إنشاء جهة اتصال' })
  create(@Req() req: { userId: string }, @Body() dto: CreateContactDto) {
    return this.contactsService.create(req.userId, dto);
  }

  @Get()
  @RequireScopes('contacts:read')
  @ApiOperation({ summary: 'قائمة جهات الاتصال' })
  findAll(
    @Req() req: { userId: string },
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contactsService.findAll(req.userId, {
      search,
      tag,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @RequireScopes('contacts:read')
  @ApiOperation({ summary: 'تفاصيل جهة اتصال' })
  findOne(@Req() req: { userId: string }, @Param('id') id: string) {
    return this.contactsService.findOne(req.userId, id);
  }

  @Patch(':id')
  @RequireScopes('contacts:write')
  @ApiOperation({ summary: 'تحديث جهة اتصال' })
  update(
    @Req() req: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(req.userId, id, dto);
  }

  @Delete(':id')
  @RequireScopes('contacts:write')
  @ApiOperation({ summary: 'حذف جهة اتصال' })
  remove(@Req() req: { userId: string }, @Param('id') id: string) {
    return this.contactsService.remove(req.userId, id);
  }
}
