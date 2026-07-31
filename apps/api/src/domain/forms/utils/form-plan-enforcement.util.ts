import { ForbiddenException } from '@nestjs/common';
import type { PlanLimits } from '../../subscriptions/plan-limits.config';
import { hasMinFeatureTier } from '../../subscriptions/form-feature-tier.util';
import type { UpdateFormDto } from '../dto';

function fieldHasConditionalRules(field: {
  conditionalLogic?: unknown;
}): boolean {
  const logic = field.conditionalLogic;
  if (!logic || typeof logic !== 'object') return false;
  const rules = (logic as { rules?: unknown[] }).rules;
  return Array.isArray(rules) && rules.length > 0;
}

export function assertFormUpdatePlanLimits(
  limits: PlanLimits,
  update: UpdateFormDto,
): void {
  const enablingWebhook =
    update.webhookEnabled === true ||
    (typeof update.webhookUrl === 'string' && update.webhookUrl.trim().length > 0);

  if (enablingWebhook && !limits.webhook) {
    throw new ForbiddenException({
      message: 'Webhooks غير متاحة في باقتك الحالية.',
      code: 'FEATURE_UNAVAILABLE',
      featureKey: 'webhook',
    });
  }

  const fields = update.fields;
  if (!fields?.length) return;

  const usesConditionalLogic = fields.some(fieldHasConditionalRules);
  if (
    usesConditionalLogic &&
    !hasMinFeatureTier(limits, 'conditionalLogic', 'basic')
  ) {
    throw new ForbiddenException({
      message: 'المنطق الشرطي غير متاح في باقتك الحالية.',
      code: 'FEATURE_UNAVAILABLE',
      featureKey: 'conditionalLogic',
    });
  }
}

export function stripAdvancedFormAnalytics<T extends Record<string, unknown>>(
  payload: T,
): T {
  const next = { ...payload };
  delete next.fieldAnalytics;
  delete next.dropOffRate;
  delete next.nps;
  delete next.geoBreakdown;
  return next;
}
