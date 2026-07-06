import { Injectable } from '@nestjs/common';
import { FormsCommandsService } from './services/forms-commands.service';
import { FormsQueriesService } from './services/forms-queries.service';
import { FormsSubmissionService } from './services/forms-submission.service';
import { FormsExportService } from './services/forms-export.service';
import { FormsStepsService } from './services/forms-steps.service';
import { FormsAnalyticsDashboardService } from './services/forms-analytics-dashboard.service';
import { FormsIntegrationsDashboardService } from './services/forms-integrations-dashboard.service';
import type { AnalyticsTrackContext } from './services/form-analytics-tracker.service';
import { FormGeoResolverService, type ResolvedGeo } from './services/form-geo-resolver.service';
import { FormsService } from './forms.service';
import { CreateFormDto, UpdateFormDto, SubmitFormDto, FormStatus } from './dto';
import type { DeleteFormDto, RestoreFormDto } from './dto';
import type { FormDeletionRequestMeta } from './services/forms-deletion.service';

/**
 * Facade for HTTP layer — delegates to CQRS services; legacy helpers via FormsService.
 */
@Injectable()
export class FormsFacadeService {
  constructor(
    private readonly commands: FormsCommandsService,
    private readonly queries: FormsQueriesService,
    private readonly submissions: FormsSubmissionService,
    private readonly exports: FormsExportService,
    private readonly steps: FormsStepsService,
    private readonly analyticsDashboard: FormsAnalyticsDashboardService,
    private readonly integrationsDashboard: FormsIntegrationsDashboardService,
    private readonly legacy: FormsService,
    private readonly geoResolver: FormGeoResolverService,
  ) {}

  /** Expose geo resolution for the diagnostic endpoint. */
  resolveGeoForDiagnostic(
    ip?: string | null,
    headers?: Record<string, string | string[] | undefined>,
  ): Promise<ResolvedGeo | null> {
    return this.geoResolver.resolveFromIp(ip, headers);
  }

  create(userId: string, dto: CreateFormDto) {
    return this.commands.create(userId, dto);
  }

  update(userId: string, formId: string, dto: UpdateFormDto) {
    return this.commands.update(userId, formId, dto);
  }

  updateStatus(userId: string, formId: string, status: FormStatus) {
    return this.commands.updateStatus(userId, formId, status);
  }

  delete(
    userId: string,
    formId: string,
    confirmTitle: string,
    reason: string | undefined,
    meta: FormDeletionRequestMeta,
  ) {
    return this.commands.delete(userId, formId, confirmTitle, reason, meta);
  }

  restore(
    userId: string,
    formId: string,
    confirmTitle: string,
    meta: FormDeletionRequestMeta,
  ) {
    return this.commands.restore(userId, formId, confirmTitle, meta);
  }

  duplicateForm(userId: string, formId: string) {
    return this.commands.duplicate(userId, formId);
  }

  findAll(filters?: Parameters<FormsQueriesService['findAll']>[0]) {
    return this.queries.findAll(filters);
  }

  findById(formId: string, userId?: string) {
    return this.queries.findById(formId, userId);
  }

  findBySlug(slug: string, trackContext?: AnalyticsTrackContext, options?: { skipViewTrack?: boolean }) {
    return this.queries.findBySlug(slug, trackContext, options);
  }

  trackPublicFormView(slug: string, trackContext?: AnalyticsTrackContext) {
    return this.queries.trackPublicView(slug, trackContext);
  }

  findPublicByUsername(username: string, limit?: number) {
    return this.queries.findPublicByUsername(username, limit);
  }

  resolveFormId(idOrSlug: string) {
    return this.legacy.resolveFormId(idOrSlug);
  }

  getFormSteps(userId: string, formId: string) {
    return this.steps.getFormSteps(userId, formId);
  }

  updateFormSteps(userId: string, formId: string, steps: unknown[]) {
    return this.steps.updateFormSteps(userId, formId, steps);
  }

  submitForm(
    formId: string,
    dto: SubmitFormDto,
    userId?: string,
    idempotencyKey?: string,
    trackContext?: AnalyticsTrackContext,
  ) {
    return this.submissions.submitForm(
      formId,
      dto,
      userId,
      idempotencyKey,
      trackContext,
    );
  }

  getWebhookDeliveries(userId: string, formId: string, limit?: number) {
    return this.queries.getWebhookDeliveries(userId, formId, limit);
  }

  getFormSubmissions(
    userId: string,
    formId: string,
    options?: {
      page?: number;
      limit?: number;
      cursor?: string;
      search?: string;
    },
  ) {
    if (options?.cursor != null || options?.search) {
      return this.submissions.getSubmissions(userId, formId, {
        cursor: options.cursor,
        limit: options.limit,
        search: options.search,
      });
    }
    return this.legacy.getFormSubmissions(
      userId,
      formId,
      options?.page,
      options?.limit,
    );
  }

  deleteSubmission(userId: string, formId: string, submissionId: string) {
    return this.submissions.deleteSubmission(userId, formId, submissionId);
  }

  getSubmissionsSummary(userId: string, formId: string) {
    return this.legacy.getSubmissionsSummary(userId, formId);
  }

  getFieldResponseCounts(userId: string, formId: string) {
    return this.legacy.getFieldResponseCounts(userId, formId);
  }

  exportSubmissions(userId: string, formId: string) {
    return this.exports.exportSubmissions(userId, formId);
  }

  exportOrphanedSubmissions(userId: string, formId: string) {
    return this.exports.exportOrphanedSubmissions(userId, formId);
  }

  getAnalyticsOverview(userId: string, days?: number) {
    return this.analyticsDashboard.getOverview(userId, days);
  }

  getFormAnalytics(userId: string, formId: string, days?: number) {
    return this.analyticsDashboard.getFormAnalytics(userId, formId, days);
  }

  getIntegrationsOverview(userId: string) {
    return this.integrationsDashboard.getOverview(userId);
  }

  testWebhook(userId: string, formId: string) {
    return this.commands.testWebhook(userId, formId);
  }

  regenerateWebhookSecret(userId: string, formId: string) {
    return this.commands.regenerateWebhookSecret(userId, formId);
  }

  recordShare(userId: string, formId: string) {
    return this.analyticsDashboard.recordShare(userId, formId);
  }
}
