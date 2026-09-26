import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../core/common/decorators/auth/current-user.decorator';
import { EmailMarketingContactsService } from './email-marketing-contacts.service';
import { EmailMarketingBroadcastsService } from './email-marketing-broadcasts.service';

class CreateContactDto {
  email!: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
}

class ImportContactsDto {
  emails!: string[];
}

class CreateBroadcastDto {
  subject!: string;
  bodyHtml?: string;
  bodyText?: string;
  contactIds?: string[];
}

@ApiTags('Developer Portal - Email API marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'developer/email/marketing', version: '1' })
export class EmailMarketingController {
  constructor(
    private readonly contacts: EmailMarketingContactsService,
    private readonly broadcasts: EmailMarketingBroadcastsService,
  ) {}

  @Get('contacts')
  listContacts(@CurrentUser() user: AuthenticatedUser) {
    return this.contacts.list(user.id);
  }

  @Post('contacts')
  createContact(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateContactDto,
  ) {
    return this.contacts.create(user.id, dto);
  }

  @Post('contacts/import')
  importContacts(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ImportContactsDto,
  ) {
    return this.contacts.importFromForms(user.id, dto.emails ?? []);
  }

  @Post('contacts/unsubscribe')
  unsubscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { email: string },
  ) {
    return this.contacts.unsubscribe(user.id, dto.email);
  }

  @Get('broadcasts')
  listBroadcasts(@CurrentUser() user: AuthenticatedUser) {
    return this.broadcasts.list(user.id);
  }

  @Post('broadcasts')
  createBroadcast(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBroadcastDto,
  ) {
    return this.broadcasts.create(user.id, dto);
  }

  @Post('broadcasts/:id/send')
  sendBroadcast(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.broadcasts.send(user.id, id);
  }
}
