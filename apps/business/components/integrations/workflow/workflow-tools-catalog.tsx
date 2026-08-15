'use client';

import { WORKFLOW_CATALOG_BY_CATEGORY } from '@/lib/workflows/catalog';
import type { WorkflowNodeType } from '@/lib/workflows/types';
import { CatalogNodeIcon } from '@/components/integrations/workflow/catalog-node-icon';
import { startNodeDrag } from '@/components/integrations/workflow/workflow-canvas';

const CATEGORY_LABELS = {
  triggers: 'المُشغِّلات',
  actions: 'الإجراءات',
  flow: 'التدفق',
  misc: 'أخرى',
} as const;

export function WorkflowToolsCatalog({
  onAdd,
  compact = false,
}: {
  onAdd: (type: WorkflowNodeType) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'p-2' : 'p-3'}>
      {(Object.keys(WORKFLOW_CATALOG_BY_CATEGORY) as Array<
        keyof typeof WORKFLOW_CATALOG_BY_CATEGORY
      >).map((category) => (
        <div key={category} className="mb-3 last:mb-0">
          <p className="mb-1.5 px-1 text-[10px] font-semibold tracking-wide text-[var(--muted-foreground)]">
            {CATEGORY_LABELS[category]}
          </p>
          <div className="space-y-1">
            {WORKFLOW_CATALOG_BY_CATEGORY[category].map((item) => (
              <ToolCatalogItem
                key={item.type}
                type={item.type}
                label={item.label}
                description={item.description}
                iconId={item.iconId}
                onAdd={onAdd}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ToolCatalogItem({
  type,
  label,
  description,
  iconId,
  onAdd,
}: {
  type: WorkflowNodeType;
  label: string;
  description: string;
  iconId: (typeof WORKFLOW_CATALOG_BY_CATEGORY)[keyof typeof WORKFLOW_CATALOG_BY_CATEGORY][number]['iconId'];
  onAdd: (type: WorkflowNodeType) => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => startNodeDrag(event, type)}
      onClick={() => onAdd(type)}
      className="flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-start transition-colors hover:bg-[var(--surface-secondary)]"
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)]">
        <CatalogNodeIcon iconId={iconId} />
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-semibold text-[var(--foreground)]">{label}</span>
        <span className="mt-0.5 block text-[10px] leading-snug text-[var(--muted-foreground)]">
          {description}
        </span>
      </span>
    </button>
  );
}
