'use client';

import { useCallback, useMemo, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { FormFieldEditorRow } from '@/components/forms/form-create/fields/form-field-editor-row';
import { FormSectionHeaderCard } from '@/components/forms/form-create/sections/form-section-header-card';
import { FormSectionTransition } from '@/components/forms/form-create/sections/form-section-transition';
import {
  useFormFieldPointerDrag,
  type FieldDropTarget,
} from '@/hooks/use-form-field-pointer-drag';
import {
  fieldsGroupedBySection,
  flattenFieldsBySections,
  type FormSectionDraft,
} from '@/lib/form-section-utils';
import { normalizeFieldOrders, type DraftFormField } from '@/lib/form-field-utils';
import { cn } from '@/lib/utils';

function adjustDropIndex(
  sectionFields: DraftFormField[],
  fieldId: string,
  targetIndex: number,
): number {
  const sourceIndex = sectionFields.findIndex((f) => f.clientId === fieldId);
  if (sourceIndex < 0) return targetIndex;
  if (sourceIndex < targetIndex) return targetIndex - 1;
  return targetIndex;
}

function FieldDropIndicator({
  sectionKey,
  index,
  active,
  visible,
}: {
  sectionKey: string;
  index: number;
  active: boolean;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div
      data-field-drop
      data-section-key={sectionKey}
      data-drop-index={index}
      className={cn(
        'pointer-events-auto rounded-xl transition-all duration-150',
        active
          ? 'my-1.5 h-11 border-2 border-dashed border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_8%,transparent)]'
          : 'h-4',
      )}
      aria-hidden
    />
  );
}

function PointerFieldCard({
  field,
  globalIndex,
  fields,
  sectionKey,
  fieldIndex,
  isSourceDragging,
  isDragSessionActive,
  collapsed,
  onCollapsedChange,
  onFieldChange,
  onRemove,
  onChangeType,
  onGripPointerDown,
}: {
  field: DraftFormField;
  globalIndex: number;
  fields: DraftFormField[];
  sectionKey: string;
  fieldIndex: number;
  isSourceDragging: boolean;
  isDragSessionActive: boolean;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onFieldChange: (field: DraftFormField) => void;
  onRemove: () => void;
  onChangeType: () => void;
  onGripPointerDown: (fieldId: string, e: React.PointerEvent<HTMLElement>) => void;
}) {
  return (
    <div
      data-field-card
      data-section-key={sectionKey}
      data-field-index={fieldIndex}
      {...(isSourceDragging ? { 'data-dragging': '' } : {})}
      className={cn(
        'group/block relative list-none rounded-2xl border bg-transparent transition-[border-color,background-color,box-shadow,opacity,transform]',
        collapsed
          ? 'border-[var(--border)]/50 bg-[var(--surface)]/50 shadow-sm'
          : 'border-transparent',
        !isSourceDragging &&
          !collapsed &&
          'hover:border-[var(--border)]/60 hover:bg-[var(--surface)]/40',
        isSourceDragging &&
          'scale-[0.98] border-[var(--foreground)]/15 bg-[var(--surface-secondary)]/50 opacity-40 shadow-none',
        isDragSessionActive && !isSourceDragging && 'pointer-events-auto',
      )}
    >
      <FormFieldEditorRow
        field={field}
        index={globalIndex}
        allFields={fields}
        onChange={onFieldChange}
        onRemove={onRemove}
        onChangeType={onChangeType}
        isDragging={isSourceDragging}
        variant="canvas"
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
        onGripPointerDown={(e) => onGripPointerDown(field.clientId, e)}
      />
    </div>
  );
}

function ReorderFieldRow({
  field,
  globalIndex,
  fields,
  collapsed,
  onCollapsedChange,
  onFieldChange,
  onRemove,
  onChangeType,
}: {
  field: DraftFormField;
  globalIndex: number;
  fields: DraftFormField[];
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onFieldChange: (field: DraftFormField) => void;
  onRemove: () => void;
  onChangeType: () => void;
}) {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Reorder.Item
      value={field}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      className={cn(
        'group/block relative list-none rounded-2xl border bg-transparent transition-[border-color,background-color,box-shadow]',
        collapsed
          ? 'border-[var(--border)]/50 bg-[var(--surface)]/50 shadow-sm'
          : 'border-transparent',
        !isDragging &&
          !collapsed &&
          'hover:border-[var(--border)]/60 hover:bg-[var(--surface)]/40',
        isDragging &&
          'z-10 border-[var(--foreground)]/20 bg-[var(--surface)] shadow-lg ring-2 ring-[var(--accent)]/30',
      )}
      whileDrag={{
        scale: 1.015,
        boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
      }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
    >
      <FormFieldEditorRow
        field={field}
        index={globalIndex}
        allFields={fields}
        onChange={onFieldChange}
        onRemove={onRemove}
        onChangeType={onChangeType}
        isDragging={isDragging}
        variant="canvas"
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
        onDragHandlePointerDown={(e) => dragControls.start(e)}
      />
    </Reorder.Item>
  );
}

interface FormSectionCanvasProps {
  sections: FormSectionDraft[];
  fields: DraftFormField[];
  assignment: Record<string, string>;
  onSectionsChange: (sections: FormSectionDraft[]) => void;
  onFieldsChange: (fields: DraftFormField[]) => void;
  onAssignmentChange: (assignment: Record<string, string>) => void;
  onFieldChange: (index: number, field: DraftFormField) => void;
  onRemoveField: (clientId: string) => void;
  onMoveField: (fieldId: string, sectionKey: string, targetIndex: number) => void;
  onChangeFieldType: (index: number) => void;
  enableCrossSectionDrag?: boolean;
}

export function FormSectionCanvas({
  sections,
  fields,
  assignment,
  onSectionsChange,
  onFieldsChange,
  onAssignmentChange,
  onFieldChange,
  onRemoveField,
  onMoveField,
  onChangeFieldType,
  enableCrossSectionDrag = false,
}: FormSectionCanvasProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());

  const setFieldCollapsed = useCallback((clientId: string, collapsed: boolean) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (collapsed) next.add(clientId);
      else next.delete(clientId);
      return next;
    });
  }, []);

  const grouped = useMemo(
    () => fieldsGroupedBySection(fields, sections, assignment),
    [fields, sections, assignment],
  );

  const handlePointerDrop = useCallback(
    (fieldId: string, target: FieldDropTarget) => {
      const sourceSectionKey = assignment[fieldId];
      if (!sourceSectionKey) return;

      const sourceFields = grouped.get(sourceSectionKey) ?? [];
      const adjustedIndex =
        sourceSectionKey === target.sectionKey
          ? adjustDropIndex(sourceFields, fieldId, target.index)
          : target.index;

      if (
        sourceSectionKey === target.sectionKey &&
        sourceFields.findIndex((f) => f.clientId === fieldId) === adjustedIndex
      ) {
        return;
      }

      onMoveField(fieldId, target.sectionKey, adjustedIndex);
    },
    [assignment, grouped, onMoveField],
  );

  const {
    draggingFieldId,
    dropTarget,
    isDragging: isDragSessionActive,
    handleGripPointerDown,
  } = useFormFieldPointerDrag({
    enabled: enableCrossSectionDrag,
    onDrop: handlePointerDrop,
  });

  function commitGrouped(nextGrouped: Map<string, DraftFormField[]>) {
    onFieldsChange(normalizeFieldOrders(flattenFieldsBySections(sections, nextGrouped)));
  }

  function handleSectionFieldsReorder(
    sectionKey: string,
    nextSectionFields: DraftFormField[],
  ) {
    const nextGrouped = new Map(grouped);
    nextGrouped.set(sectionKey, nextSectionFields);
    commitGrouped(nextGrouped);
  }

  function updateSection(index: number, next: FormSectionDraft) {
    onSectionsChange(
      sections.map((s, i) => (i === index ? next : s)),
    );
  }

  function removeSection(clientKey: string) {
    if (sections.length <= 1) return;
    const fallback = sections.find((s) => s.clientKey !== clientKey)?.clientKey;
    if (!fallback) return;

    const nextAssignment = { ...assignment };
    for (const [fieldId, key] of Object.entries(nextAssignment)) {
      if (key === clientKey) nextAssignment[fieldId] = fallback;
    }

    onAssignmentChange(nextAssignment);
    onSectionsChange(sections.filter((s) => s.clientKey !== clientKey));
    onFieldsChange(
      normalizeFieldOrders(
        flattenFieldsBySections(
          sections.filter((s) => s.clientKey !== clientKey),
          fieldsGroupedBySection(fields, sections, nextAssignment),
        ),
      ),
    );
  }

  function setSectionFieldsCollapsed(
    sectionFields: DraftFormField[],
    collapsed: boolean,
  ) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      for (const field of sectionFields) {
        if (collapsed) next.add(field.clientId);
        else next.delete(field.clientId);
      }
      return next;
    });
  }

  function renderFieldsBlock(
    sectionKey: string,
    sectionFields: DraftFormField[],
    showSectionChrome: boolean,
  ) {
    const isDropSection = dropTarget?.sectionKey === sectionKey;
    const sectionCollapsedCount = sectionFields.filter((f) =>
      collapsedIds.has(f.clientId),
    ).length;
    const allSectionCollapsed =
      sectionFields.length > 0 && sectionCollapsedCount === sectionFields.length;
    const fieldsToolbar =
      sectionFields.length >= 3 ? (
        <div className="mb-3 flex items-center justify-end gap-1 px-1">
          <button
            type="button"
            onClick={() => setSectionFieldsCollapsed(sectionFields, !allSectionCollapsed)}
            className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
          >
            {allSectionCollapsed ? 'توسيع كل الحقول' : 'طي كل الحقول'}
          </button>
        </div>
      ) : null;

    if (enableCrossSectionDrag) {
      return (
        <div
          data-section-drop
          data-section-key={sectionKey}
          className={cn(
            'min-h-[2rem] rounded-2xl transition-colors',
            isDragSessionActive &&
              isDropSection &&
              'bg-[color-mix(in_srgb,var(--primary)_5%,transparent)]',
          )}
        >
          {fieldsToolbar}
          {sectionFields.length > 0 ? (
            <div className="flex flex-col gap-3">
              {sectionFields.map((field, fieldIndex) => {
                const globalIndex = fields.findIndex(
                  (f) => f.clientId === field.clientId,
                );
                const isSourceDragging = draggingFieldId === field.clientId;

                return (
                  <div key={field.clientId}>
                    <FieldDropIndicator
                      sectionKey={sectionKey}
                      index={fieldIndex}
                      active={
                        dropTarget?.sectionKey === sectionKey &&
                        dropTarget.index === fieldIndex
                      }
                      visible={isDragSessionActive}
                    />
                    <PointerFieldCard
                      field={field}
                      globalIndex={globalIndex}
                      fields={fields}
                      sectionKey={sectionKey}
                      fieldIndex={fieldIndex}
                      isSourceDragging={isSourceDragging}
                      isDragSessionActive={isDragSessionActive}
                      collapsed={collapsedIds.has(field.clientId)}
                      onCollapsedChange={(c) => setFieldCollapsed(field.clientId, c)}
                      onFieldChange={(next) => onFieldChange(globalIndex, next)}
                      onRemove={() => onRemoveField(field.clientId)}
                      onChangeType={() => onChangeFieldType(globalIndex)}
                      onGripPointerDown={handleGripPointerDown}
                    />
                  </div>
                );
              })}
              <FieldDropIndicator
                sectionKey={sectionKey}
                index={sectionFields.length}
                active={
                  dropTarget?.sectionKey === sectionKey &&
                  dropTarget.index === sectionFields.length
                }
                visible={isDragSessionActive}
              />
            </div>
          ) : showSectionChrome ? (
            <div
              data-field-drop
              data-section-key={sectionKey}
              data-drop-index={0}
              className={cn(
                'rounded-xl border border-dashed px-4 py-8 text-center text-xs transition-colors',
                isDragSessionActive && isDropSection && dropTarget?.index === 0
                  ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--primary)]'
                  : 'border-[var(--border)]/60 text-[var(--muted-foreground)]',
              )}
            >
              {isDragSessionActive && isDropSection && dropTarget?.index === 0
                ? 'أفلت الحقل هنا'
                : 'اسحب حقلاً إلى هذا القسم أو أضف حقلًا جديدًا'}
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="min-h-[2rem] rounded-2xl">
        {fieldsToolbar}
        {sectionFields.length > 0 ? (
          <Reorder.Group
            axis="y"
            values={sectionFields}
            onReorder={(next) => handleSectionFieldsReorder(sectionKey, next)}
            className="flex flex-col gap-3"
          >
            {sectionFields.map((field) => {
              const globalIndex = fields.findIndex(
                (f) => f.clientId === field.clientId,
              );
              return (
                <ReorderFieldRow
                  key={field.clientId}
                  field={field}
                  globalIndex={globalIndex}
                  fields={fields}
                  collapsed={collapsedIds.has(field.clientId)}
                  onCollapsedChange={(c) => setFieldCollapsed(field.clientId, c)}
                  onFieldChange={(next) => onFieldChange(globalIndex, next)}
                  onRemove={() => onRemoveField(field.clientId)}
                  onChangeType={() => onChangeFieldType(globalIndex)}
                />
              );
            })}
          </Reorder.Group>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn('space-y-4', isDragSessionActive && 'select-none')}
      aria-live={isDragSessionActive ? 'polite' : undefined}
    >
      {isDragSessionActive ? (
        <p className="sr-only">اسحب الحقل وأفلته في الموضع المطلوب. اضغط Escape للإلغاء.</p>
      ) : null}

      {sections.map((section, sectionIndex) => {
        const sectionFields = grouped.get(section.clientKey) ?? [];
        const showSectionChrome = sections.length > 1;
        const fieldsBlock = renderFieldsBlock(
          section.clientKey,
          sectionFields,
          showSectionChrome,
        );

        if (!showSectionChrome) {
          return <div key={section.clientKey}>{fieldsBlock}</div>;
        }

        const block = (
          <div className="space-y-3">
            <div
              data-field-drop
              data-section-key={section.clientKey}
              data-drop-index={0}
              className={cn(
                isDragSessionActive &&
                  dropTarget?.sectionKey === section.clientKey &&
                  dropTarget.index === 0 &&
                  'rounded-2xl ring-2 ring-[var(--primary)]/20',
              )}
            >
              <FormSectionHeaderCard
                section={section}
                index={sectionIndex}
                total={sections.length}
                canRemove={sections.length > 1}
                isDropTarget={
                  isDragSessionActive &&
                  dropTarget?.sectionKey === section.clientKey &&
                  dropTarget.index === 0
                }
                onChange={(next) => updateSection(sectionIndex, next)}
                onRemove={() => removeSection(section.clientKey)}
              />
            </div>
            {fieldsBlock}
          </div>
        );

        if (sectionIndex < sections.length - 1) {
          const nextSection = sections[sectionIndex + 1];
          return (
            <div key={section.clientKey}>
              {block}
              <FormSectionTransition
                fromIndex={sectionIndex}
                toTitle={nextSection?.title ?? ''}
              />
            </div>
          );
        }

        return <div key={section.clientKey}>{block}</div>;
      })}
    </div>
  );
}
