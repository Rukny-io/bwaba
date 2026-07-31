'use client';

import { GitBranch, Plus, Trash2 } from 'lucide-react';
import { Button, Label, Switch } from '@heroui/react';
import { ConditionalLogicValueInput } from '@/components/forms/form-create/fields/conditional-logic-value-input';
import { fieldInputClass } from '@/components/forms/shared/form-field-input-class';
import {
  fieldTypeHint,
  getOperatorsForFieldType,
  getValueInputConfig,
  normalizeRuleForSourceField,
  priorSourceFields,
} from '@/lib/conditional-logic-field-utils';
import {
  CONDITIONAL_ACTION_OPTIONS,
  emptyConditionalLogic,
  parseConditionalLogic,
  type ConditionalLogic,
} from '@/lib/conditional-logic-types';
import type { DraftFormField } from '@/lib/form-field-utils';
import { WIZARD_FIELD_TYPE_LABELS } from '@/lib/form-field-types';
import {
  PlanUpgradeBanner,
  usePlanFeature,
} from '@/components/plan/plan-feature-gate';
import { cn } from '@/lib/utils';

interface ConditionalLogicEditorProps {
  field: DraftFormField;
  allFields: DraftFormField[];
  onChange: (logic: ConditionalLogic | undefined) => void;
}

function findSource(
  fieldId: string,
  sources: DraftFormField[],
): DraftFormField | undefined {
  return sources.find((f) => f.clientId === fieldId);
}

export function ConditionalLogicEditor({
  field,
  allFields,
  onChange,
}: ConditionalLogicEditorProps) {
  const { enabled: planAllows, plan, loading } = usePlanFeature('conditionalLogic');
  const sources = priorSourceFields(field, allFields);
  const enabled = Boolean(field.conditionalLogic);
  const logic =
    parseConditionalLogic(field.conditionalLogic) ??
    emptyConditionalLogic(sources[0]?.clientId ?? '');

  function setEnabled(next: boolean) {
    if (next && !planAllows) return;
    if (!next) {
      onChange(undefined);
      return;
    }
    const first = sources[0];
    onChange(
      parseConditionalLogic(field.conditionalLogic) ??
        emptyConditionalLogic(first?.clientId ?? ''),
    );
  }

  function updateLogic(next: ConditionalLogic) {
    onChange(next);
  }

  if (sources.length === 0) {
    return (
      <p className="text-[12px] text-[var(--muted-foreground)]">
        أضف حقلاً <strong>قبل</strong> هذا الحقل في القائمة — الشرط يعتمد على
        إجابات سابقة فقط.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="mt-4 h-14 animate-pulse rounded-2xl bg-[var(--surface-secondary)]/50" />
    );
  }

  if (!planAllows && !enabled) {
    return (
      <div className="mt-4">
        <PlanUpgradeBanner feature="conditionalLogic" plan={plan} />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-secondary)]/30 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitBranch className="size-4 text-[var(--muted-foreground)]" />
          <Label className="text-sm font-medium">منطق شرطي</Label>
        </div>
        <Switch
          isSelected={enabled}
          onChange={setEnabled}
          aria-label="تفعيل المنطق الشرطي"
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>

      {enabled ? (
        <div className="space-y-3">
          <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">
            المشغّلات ونوع القيمة يتغيّران تلقائياً حسب نوع الحقل المرجعي
            (بريد، تاريخ، قائمة…).
          </p>

          <div className="flex gap-2">
            {(['AND', 'OR'] as const).map((gate) => (
              <button
                key={gate}
                type="button"
                onClick={() => updateLogic({ ...logic, logic: gate })}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  logic.logic === gate
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'bg-[var(--surface)] text-[var(--muted-foreground)]',
                )}
              >
                {gate === 'AND' ? 'كل الشروط' : 'أي شرط'}
              </button>
            ))}
          </div>

          {logic.rules.map((rule, index) => {
            const sourceField = findSource(rule.fieldId, sources);
            const operators = sourceField
              ? getOperatorsForFieldType(sourceField.type)
              : [];
            const valueConfig = sourceField
              ? getValueInputConfig(sourceField, rule.operator)
              : { kind: 'none' as const };

            return (
              <div
                key={index}
                className="space-y-2 rounded-xl border border-[var(--border)]/50 bg-[var(--surface)] p-3"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      يعتمد على
                    </span>
                    <select
                      value={rule.fieldId}
                      onChange={(e) => {
                        const nextSource = findSource(e.target.value, sources);
                        const rules = [...logic.rules];
                        rules[index] = normalizeRuleForSourceField(
                          { ...rule, fieldId: e.target.value },
                          nextSource,
                        );
                        updateLogic({ ...logic, rules });
                      }}
                      className={cn(fieldInputClass, 'w-full px-3 py-2 text-sm')}
                    >
                      {sources.map((f) => (
                        <option key={f.clientId} value={f.clientId}>
                          {f.label} ({WIZARD_FIELD_TYPE_LABELS[f.type]})
                        </option>
                      ))}
                    </select>
                    {sourceField ? (
                      <span className="block text-[10px] text-[var(--muted-foreground)]">
                        {fieldTypeHint(sourceField.type)}
                      </span>
                    ) : null}
                  </label>

                  <label className="space-y-1">
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      المشغّل
                    </span>
                    <select
                      value={rule.operator}
                      onChange={(e) => {
                        const rules = [...logic.rules];
                        const operator = e.target.value as typeof rule.operator;
                        rules[index] = normalizeRuleForSourceField(
                          { ...rule, operator },
                          sourceField,
                        );
                        updateLogic({ ...logic, rules });
                      }}
                      className={cn(fieldInputClass, 'w-full px-3 py-2 text-sm')}
                    >
                      {operators.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {sourceField && valueConfig.kind !== 'none' ? (
                  <ConditionalLogicValueInput
                    config={valueConfig}
                    value={rule.value ?? ''}
                    onChange={(value) => {
                      const rules = [...logic.rules];
                      rules[index] = { ...rule, value };
                      updateLogic({ ...logic, rules });
                    }}
                  />
                ) : null}

                <label className="block space-y-1">
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    الإجراء
                  </span>
                  <select
                    value={rule.action}
                    onChange={(e) => {
                      const rules = [...logic.rules];
                      rules[index] = {
                        ...rule,
                        action: e.target.value as typeof rule.action,
                      };
                      updateLogic({ ...logic, rules });
                    }}
                    className={cn(fieldInputClass, 'w-full px-3 py-2 text-sm')}
                  >
                    {CONDITIONAL_ACTION_OPTIONS.map((action) => (
                      <option key={action.value} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </label>

                {logic.rules.length > 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 rounded-full text-[var(--danger)]"
                    onPress={() => {
                      updateLogic({
                        ...logic,
                        rules: logic.rules.filter((_, i) => i !== index),
                      });
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    حذف الشرط
                  </Button>
                ) : null}
              </div>
            );
          })}

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1 rounded-full"
            onPress={() => {
              const first = sources[0];
              updateLogic({
                ...logic,
                rules: [
                  ...logic.rules,
                  normalizeRuleForSourceField(
                    {
                      fieldId: first?.clientId ?? '',
                      operator: 'equals',
                      value: '',
                      action: 'show',
                    },
                    first,
                  ),
                ],
              });
            }}
          >
            <Plus className="size-3.5" />
            شرط إضافي
          </Button>
        </div>
      ) : null}
    </div>
  );
}
