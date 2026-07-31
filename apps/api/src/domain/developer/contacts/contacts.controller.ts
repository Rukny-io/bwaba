import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { WorkspaceGuard } from '../../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../../workspace/workspace-context.middleware';

@ApiTags('Developer - Contacts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceGuard)
@Controller({ path: 'developer/contacts', version: '1' })
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @RequiresWorkspacePermission('developer:contacts:write')
  @ApiOperation({ summary: 'إنشاء جهة اتصال' })
  create(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() dto: CreateContactDto,
  ) {
    return this.contactsService.create(ws.ownerId, dto);
  }

  @Get()
  @RequiresWorkspacePermission('developer:contacts:read')
  @ApiOperation({ summary: 'قائمة جهات الاتصال' })
  findAll(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contactsService.findAll(ws.ownerId, {
      search,
      tag,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @RequiresWorkspacePermission('developer:contacts:read')
  @ApiOperation({ summary: 'تفاصيل جهة اتصال' })
  findOne(@ActiveWorkspace() ws: WorkspaceContext, @Param('id') id: string) {
    return this.contactsService.findOne(ws.ownerId, id);
  }

  @Patch(':id')
  @RequiresWorkspacePermission('developer:contacts:write')
  @ApiOperation({ summary: 'تحديث جهة اتصال' })
  update(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(ws.ownerId, id, dto);
  }

  @Delete(':id')
  @RequiresWorkspacePermission('developer:contacts:write')
  @ApiOperation({ summary: 'حذف جهة اتصال' })
  remove(@ActiveWorkspace() ws: WorkspaceContext, @Param('id') id: string) {
    return this.contactsService.remove(ws.ownerId, id);
  }
}
