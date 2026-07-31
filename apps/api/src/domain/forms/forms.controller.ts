import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Headers,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { FormsFacadeService } from './forms-facade.service';
import {
  CreateFormDto,
  UpdateFormDto,
  SubmitFormDto,
  FormStatus,
  SendVerificationCodeDto,
  VerifyEmailCodeDto,
  SendPhoneVerificationCodeDto,
  VerifyPhoneCodeDto,
  DeleteFormDto,
  RestoreFormDto,
} from './dto';
import { FormsEmailVerificationService } from './services/forms-email-verification.service';
import { FormsPhoneVerificationService } from './services/forms-phone-verification.service';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { JwtOrApiKeyGuard } from '../developer/api-keys/guards/jwt-or-api-key.guard';
import { RequireScopes } from '../developer/api-keys/decorators/require-scopes.decorator';
import { WorkspaceGuard } from '../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../workspace/workspace-context.middleware';
import { PlanGuard } from '../../core/common/guards/plan.guard';
import {
  CheckLimit,
  CheckFeature,
  CheckFeatureTier,
  RequirePlan,
} from '../../core/common/decorators/auth/plan.decorator';
import { OptionalUserId } from '../../core/common/decorators/auth/optional-user.decorator';
import { SubmitContentLengthGuard } from './guards/submit-content-length.guard';
import { parsePageLimit } from './utils/forms-pagination.util';
import { getClientIp } from './utils/client-ip.util';
import type { AnalyticsTrackContext } from './services/form-analytics-tracker.service';
import type { Request as ExpressRequest } from 'express';
import { FormTeamService } from './form-team/form-team.service';
import { DevFormsService } from '../developer/forms/dev-forms.service';
import {
  InviteFormTeamMemberDto,
  UpdateFormTeamMemberDto,
} from './form-team/dto/form-team.dto';
import { LinkFormDeveloperEmbedDto } from '../developer/forms/dto/dev-forms.dto';

function buildTrackContext(req: ExpressRequest): AnalyticsTrackContext {
  return {
    ip: getClientIp(req),
    headers: req.headers as Record<string, string | string[] | undefined>,
    userAgent:
      typeof req.headers['user-agent'] === 'string'
        ? req.headers['user-agent']
        : undefined,
  };
}

function shouldSkipViewTrack(header?: string): boolean {
  return header === '1' || header === 'true';
}

@ApiTags('Forms')
@Controller('forms')
export class FormsController {
  constructor(
    private readonly forms: FormsFacadeService,
    private readonly emailVerification: FormsEmailVerificationService,
    private readonly phoneVerification: FormsPhoneVerificationService,
    private readonly formTeam: FormTeamService,
    private readonly devForms: DevFormsService,
  ) {}

  // ==================== PUBLIC ENDPOINTS ====================

  /**
   * Diagnostic endpoint — verifies Cloudflare geo headers are reaching the API.
   * Returns the detected country, city, IP, and resolution source.
   * Safe to expose: contains no user data, just geo probe info.
   */
  @Get('public/geo-check')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Geo header diagnostic (public)',
    description:
      'Returns detected country/city/IP and which geo provider resolved the data. ' +
      'Use to verify Cloudflare IP Geolocation is enabled and headers reach the API.',
  })
  async geoCheck(@Req() req: ExpressRequest) {
    const trackCtx = buildTrackContext(req);
    const geo = await this.forms.resolveGeoForDiagnostic(
      trackCtx.ip,
      trackCtx.headers,
    );
    return {
      ip: trackCtx.ip ?? null,
      cloudflareHeaders: {
        'cf-ipcountry': this.headerVal(req, 'cf-ipcountry'),
        'cf-ipcity': this.headerVal(req, 'cf-ipcity'),
        'cf-ipregion': this.headerVal(req, 'cf-ipregion'),
        'cf-ipregioncode': this.headerVal(req, 'cf-ipregioncode'),
        'cf-iplatitude': this.headerVal(req, 'cf-iplatitude'),
        'cf-iplongitude': this.headerVal(req, 'cf-iplongitude'),
        'cf-connecting-ip': this.headerVal(req, 'cf-connecting-ip'),
      },
      resolved: geo
        ? {
            countryCode: geo.countryCode,
            countryName: geo.countryName,
            city: geo.city,
            governorateCode: geo.governorateCode || null,
            source: geo.source,
          }
        : null,
    };
  }

  private headerVal(req: ExpressRequest, name: string): string | null {
    const raw = req.headers[name.toLowerCase()];
    if (!raw) return null;
    return Array.isArray(raw) ? raw[0] : raw;
  }

  @Get('public/user/:username')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get published forms by username (public)' })
  async getPublicFormsByUsername(
    @Param('username') username: string,
    @Query('limit') limit?: number,
  ) {
    return this.forms.findPublicByUsername(
      username,
      parsePageLimit(limit, 10),
    );
  }

  @Get('public/:slug/embed-policy')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Embed CSP policy for iframe embedding (public)',
    description:
      'Returns allowed frame-ancestors when the form is linked to a developer app with configured origins.',
  })
  async getEmbedPolicy(@Param('slug') slug: string) {
    const policy = await this.devForms.getPublicEmbedPolicy(slug);
    if (!policy) {
      throw new NotFoundException('Embed not available for this form');
    }
    return policy;
  }

  @Get('public/:slug')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get form by slug (public)' })
  @ApiHeader({
    name: 'X-Rukny-Skip-View-Track',
    required: false,
    description: 'Set to 1 for SSR/internal fetches that should not count a view',
  })
  async getPublicForm(
    @Param('slug') slug: string,
    @Req() req: ExpressRequest,
    @Headers('x-rukny-skip-view-track') skipViewTrackHeader?: string,
  ) {
    return this.forms.findBySlug(slug, buildTrackContext(req), {
      skipViewTrack: shouldSkipViewTrack(skipViewTrackHeader),
    });
  }

  @Post('public/:slug/view')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Track public form view (browser)',
    description:
      'Records a view with Cloudflare geo headers. Used by the public form page after SSR load.',
  })
  async trackPublicFormView(
    @Param('slug') slug: string,
    @Req() req: ExpressRequest,
  ) {
    return this.forms.trackPublicFormView(slug, buildTrackContext(req));
  }

  @Post('public/:slug/submit')
  @UseGuards(SubmitContentLengthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit form (public)', description: 'Max payload size is 5MB' })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'Optional unique key to prevent duplicate submissions on network retries' })
  async submitPublicForm(
    @Param('slug') slug: string,
    @Body() submitFormDto: SubmitFormDto,
    @Req() req: ExpressRequest,
    @OptionalUserId() userId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const trackContext = buildTrackContext(req);
    trackContext.userAgent =
      trackContext.userAgent ?? submitFormDto.userAgent ?? undefined;
    const form = await this.forms.findBySlug(slug, trackContext, {
      skipViewTrack: true,
    });
    return this.forms.submitForm(
      form.id,
      submitFormDto,
      userId,
      idempotencyKey,
      trackContext,
    );
  }

  @Post('public/:slug/verify-email/send')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email verification code for form field' })
  async sendPublicEmailVerification(
    @Param('slug') slug: string,
    @Body() dto: SendVerificationCodeDto,
  ) {
    const form = await this.forms.findBySlug(slug);
    return this.emailVerification.sendCode(form.id, dto.fieldId, dto.email);
  }

  @Post('public/:slug/verify-email/confirm')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm email verification code' })
  async confirmPublicEmailVerification(
    @Param('slug') slug: string,
    @Body() dto: VerifyEmailCodeDto,
  ) {
    const form = await this.forms.findBySlug(slug);
    return this.emailVerification.verifyCode(form.id, dto.email, dto.code);
  }

  @Post('public/:slug/verify-phone/send')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send WhatsApp verification code for phone field' })
  async sendPublicPhoneVerification(
    @Param('slug') slug: string,
    @Body() dto: SendPhoneVerificationCodeDto,
  ) {
    const form = await this.forms.findBySlug(slug);
    return this.phoneVerification.sendCode(form.id, dto.fieldId, dto.phone);
  }

  @Post('public/:slug/verify-phone/confirm')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm WhatsApp verification code' })
  async confirmPublicPhoneVerification(
    @Param('slug') slug: string,
    @Body() dto: VerifyPhoneCodeDto,
  ) {
    const form = await this.forms.findBySlug(slug);
    return this.phoneVerification.verifyCode(form.id, dto.phone, dto.code);
  }

  // ==================== AUTHENTICATED ENDPOINTS ====================

  @Post()
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard, PlanGuard)
  @RequiresWorkspacePermission('forms:write')
  @RequireScopes('forms:write')
  @CheckLimit('forms')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new form' })
  async create(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() createFormDto: CreateFormDto,
  ) {
    return this.forms.create(ws.ownerId, createFormDto);
  }

  @Get()
  @SkipThrottle()
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:read')
  @RequireScopes('forms:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all forms for current user' })
  async getUserForms(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('linkedEventId') linkedEventId?: string,
    @Query('linkedStoreId') linkedStoreId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('visibility') visibility?: 'active' | 'deleted' | 'all',
  ) {
    return this.forms.findAll({
      userId: ws.ownerId,
      type,
      status,
      linkedEventId,
      linkedStoreId,
      page: page ? Number(page) : undefined,
      limit: parsePageLimit(limit, 20),
      visibility: visibility ?? 'active',
    });
  }

  @Get('analytics/overview')
  @SkipThrottle()
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard, PlanGuard)
  @RequiresWorkspacePermission('forms:analytics:read')
  @RequireScopes('forms:read')
  @CheckFeatureTier('formAnalytics', 'basic')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analytics overview for all user forms' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getAnalyticsOverview(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('days') days?: number,
  ) {
    const periodDays = days ? Math.min(Math.max(Number(days), 1), 365) : 30;
    return this.forms.getAnalyticsOverview(ws.ownerId, periodDays);
  }

  @Get('integrations/overview')
  @SkipThrottle()
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:read')
  @RequireScopes('forms:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Integrations overview for all user forms' })
  async getIntegrationsOverview(@ActiveWorkspace() ws: WorkspaceContext) {
    return this.forms.getIntegrationsOverview(ws.ownerId);
  }

  // ==================== TEAM (must be before :id) ====================

  @Get('team')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List team members for my workspace' })
  listTeamMembers(@Request() req: { user: { id: string } }) {
    return this.formTeam.listMembers(req.user.id, req.user.id);
  }

  @Get('team/invitations')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List pending team invitations for current user' })
  listTeamInvitations(@Request() req: { user: { id: string } }) {
    return this.formTeam.listMyInvitations(req.user.id);
  }

  @Get('team/workspaces')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List workspaces I am a team member of' })
  listTeamWorkspaces(@Request() req: { user: { id: string } }) {
    return this.formTeam.listMyWorkspaces(req.user.id);
  }

  @Post('team/workspaces/:workspaceId/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a team workspace you joined' })
  leaveTeamWorkspace(
    @Request() req: { user: { id: string } },
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.formTeam.leaveWorkspace(workspaceId, req.user.id);
  }

  @Post('team/invite')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @CheckFeature('formTeam')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a user to my forms team' })
  inviteTeamMember(
    @Request() req: { user: { id: string } },
    @Body() dto: InviteFormTeamMemberDto,
  ) {
    return this.formTeam.inviteMember(req.user.id, req.user.id, dto);
  }

  @Patch('team/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update team member role' })
  updateTeamMember(
    @Request() req: { user: { id: string } },
    @Param('memberId') memberId: string,
    @Body() dto: UpdateFormTeamMemberDto,
  ) {
    return this.formTeam.updateMember(
      req.user.id,
      memberId,
      req.user.id,
      dto,
    );
  }

  @Delete('team/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove team member or cancel invitation' })
  removeTeamMember(
    @Request() req: { user: { id: string } },
    @Param('memberId') memberId: string,
  ) {
    return this.formTeam.removeMember(req.user.id, memberId, req.user.id);
  }

  @Post('team/invitations/:memberId/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a team invitation' })
  acceptTeamInvitation(
    @Request() req: { user: { id: string } },
    @Param('memberId') memberId: string,
  ) {
    return this.formTeam.acceptInvitation(memberId, req.user.id);
  }

  @Post('team/invitations/:memberId/decline')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Decline a team invitation' })
  declineTeamInvitation(
    @Request() req: { user: { id: string } },
    @Param('memberId') memberId: string,
  ) {
    return this.formTeam.declineInvitation(memberId, req.user.id);
  }

  @Get(':id')
  @SkipThrottle()
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:read')
  @RequireScopes('forms:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get form by ID or slug' })
  async getForm(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.forms.findById(formId, ws.ownerId);
  }

  @Put(':id')
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard, PlanGuard)
  @RequiresWorkspacePermission('forms:write')
  @RequireScopes('forms:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update form' })
  async update(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Body() updateFormDto: UpdateFormDto,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.forms.update(ws.ownerId, formId, updateFormDto);
  }

  @Put(':id/status')
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:write')
  @RequireScopes('forms:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update form status' })
  async updateStatus(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Body('status') status: FormStatus,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.forms.updateStatus(ws.ownerId, formId, status);
  }

  @Post(':id/delete')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:write')
  @RequireScopes('forms:write')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Soft-delete form (requires title confirmation)',
    description:
      'Prefer this over DELETE — some proxies do not forward DELETE request bodies.',
  })
  async softDelete(
    @Request() req,
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Body() dto: DeleteFormDto,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.forms.delete(ws.ownerId, formId, dto.confirmTitle, dto.reason, {
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });
  }

  @Delete(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtOrApiKeyGuard)
  @RequireScopes('forms:write')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.METHOD_NOT_ALLOWED)
  @ApiOperation({
    summary: 'Deprecated — use POST /forms/:id/delete',
    deprecated: true,
  })
  async deleteLegacy() {
    throw new MethodNotAllowedException(
      'Form deletion requires POST /api/v1/forms/:id/delete with JSON body { confirmTitle, reason? }. ' +
        'DELETE is not supported because request bodies are dropped by proxies.',
    );
  }

  @Post(':id/restore')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:write')
  @RequireScopes('forms:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a soft-deleted form' })
  async restore(
    @Request() req,
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Body() dto: RestoreFormDto,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.forms.restore(ws.ownerId, formId, dto.confirmTitle, {
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });
  }

  @Post(':id/duplicate')
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:write')
  @RequireScopes('forms:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Duplicate form (includes steps)' })
  async duplicate(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.forms.duplicateForm(ws.ownerId, formId);
  }

  @Get(':id/developer-embed')
  @SkipThrottle()
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:read')
  @RequireScopes('forms:read')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Developer app embed integration status for a form',
    description:
      'Returns iframe embed settings when the form is linked to a Rukny Developers app.',
  })
  async getDeveloperEmbed(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.devForms.getFormDeveloperEmbed(ws.ownerId, formId);
  }

  @Get(':id/developer-embed/link-targets')
  @SkipThrottle()
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:read')
  @RequireScopes('forms:read')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Developer apps available to link this form (with signed challenges)',
  })
  async getDeveloperEmbedLinkTargets(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.devForms.listFormLinkTargets(ws.ownerId, formId);
  }

  @Post(':id/developer-embed/link')
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:write')
  @RequireScopes('forms:write')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Link form to a developer app using a signed challenge',
  })
  async linkDeveloperEmbed(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Body() dto: LinkFormDeveloperEmbedDto,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.devForms.linkFormWithChallenge(
      ws.ownerId,
      formId,
      dto.appId,
      dto.linkChallenge,
    );
  }

  @Get(':id/webhook-deliveries')
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:read')
  @RequireScopes('forms:webhooks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List recent webhook delivery attempts for a form' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getWebhookDeliveries(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.forms.getWebhookDeliveries(
      ws.ownerId,
      formId,
      limit ? Number(limit) : undefined,
    );
  }

  @Post(':id/webhooks/test')
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:write')
  @RequireScopes('forms:webhooks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a test payload to the form webhook URL' })
  async testWebhook(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.forms.testWebhook(ws.ownerId, formId);
  }

  @Post(':id/webhooks/regenerate-secret')
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:write')
  @RequireScopes('forms:webhooks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate webhook signing secret (shown once)' })
  async regenerateWebhookSecret(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.forms.regenerateWebhookSecret(ws.ownerId, formId);
  }

  @Post(':id/submit')
  @UseGuards(JwtOrApiKeyGuard, SubmitContentLengthGuard)
  @RequireScopes('forms:write')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit form (authenticated)', description: 'Max payload size is 5MB' })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'Optional unique key to prevent duplicate submissions on network retries' })
  async submitForm(
    @Request() req,
    @Param('id') id: string,
    @Body() submitFormDto: SubmitFormDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    // إرسال الفورم يُحفظ باسم المرسل الفعلي (actorId)، لأن الإرسال ليس مقيّداً بمساحة عمل.
    const formId = await this.forms.resolveFormId(id);
    return this.forms.submitForm(formId, submitFormDto, req.user.id, idempotencyKey);
  }

  @Get(':id/submissions')
  @SkipThrottle()
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:submissions:read')
  @RequireScopes('forms:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get form submissions (offset or cursor pagination)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getSubmissions(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
    @Query('search') search?: string,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.forms.getFormSubmissions(ws.ownerId, formId, {
      page: page ? Number(page) : undefined,
      limit: parsePageLimit(limit, 20),
      cursor,
      search,
    });
  }

  @Get(':id/submissions/summary')
  @SkipThrottle()
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:submissions:read')
  @RequireScopes('forms:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submissions summary per field' })
  async getSubmissionsSummary(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.forms.getSubmissionsSummary(ws.ownerId, formId);
  }

  @Get(':id/submissions/field-response-counts')
  @SkipThrottle()
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:submissions:read')
  @RequireScopes('forms:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Response counts per field (for editor warnings)' })
  async getFieldResponseCounts(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.forms.getFieldResponseCounts(ws.ownerId, formId);
  }

  @Delete(':id/submissions/:submissionId')
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:submissions:write')
  @RequireScopes('forms:write')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubmission(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
  ) {
    const formId = await this.forms.resolveFormId(id);
    await this.forms.deleteSubmission(ws.ownerId, formId, submissionId);
  }

  @Get(':id/steps')
  @SkipThrottle()
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard, PlanGuard)
  @RequiresWorkspacePermission('forms:read')
  @RequireScopes('forms:read')
  @CheckFeature('multiStepForms')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get form steps' })
  async getFormSteps(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.forms.getFormSteps(ws.ownerId, formId);
  }

  @Put(':id/steps')
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard, PlanGuard)
  @RequiresWorkspacePermission('forms:write')
  @RequireScopes('forms:write')
  @CheckFeature('multiStepForms')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update form steps' })
  async updateFormSteps(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Body() body: { steps: unknown[] },
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.forms.updateFormSteps(ws.ownerId, formId, body.steps);
  }

  @Post(':id/analytics/share')
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('forms:write')
  @RequireScopes('forms:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record form link share' })
  async recordAnalyticsShare(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    const formId = await this.forms.resolveFormId(id);
    return this.forms.recordShare(ws.ownerId, formId);
  }

  @Get(':id/analytics')
  @SkipThrottle()
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard, PlanGuard)
  @RequiresWorkspacePermission('forms:analytics:read')
  @RequireScopes('forms:read')
  @CheckFeatureTier('formAnalytics', 'basic')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get form analytics' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getAnalytics(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Query('days') days?: number,
  ) {
    const formId = await this.forms.resolveFormId(id);
    const periodDays = days ? Math.min(Math.max(Number(days), 1), 365) : 30;
    return this.forms.getFormAnalytics(ws.ownerId, formId, periodDays);
  }

  @Get(':id/export/orphaned')
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard, PlanGuard)
  @RequiresWorkspacePermission('forms:export:read')
  @RequireScopes('forms:read')
  @RequirePlan('PRO')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export orphaned (deleted-field) submissions as CSV' })
  async exportOrphanedSubmissions(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const formId = await this.forms.resolveFormId(id);
    const result = await this.forms.exportOrphanedSubmissions(ws.ownerId, formId);
    const csvWithBOM = '\uFEFF' + result.content;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.send(csvWithBOM);
  }

  @Get(':id/export')
  @UseGuards(JwtOrApiKeyGuard, WorkspaceGuard, PlanGuard)
  @RequiresWorkspacePermission('forms:export:read')
  @RequireScopes('forms:read')
  @CheckFeatureTier('formAnalytics', 'full')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export submissions as CSV' })
  async exportSubmissions(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const formId = await this.forms.resolveFormId(id);
    const result = await this.forms.exportSubmissions(ws.ownerId, formId);
    const csvWithBOM = '\uFEFF' + result.content;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.send(csvWithBOM);
  }
}
