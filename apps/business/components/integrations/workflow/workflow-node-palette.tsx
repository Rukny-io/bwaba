'use client';

import { WorkflowToolsCatalog } from '@/components/integrations/workflow/workflow-tools-catalog';
import type { WorkflowNodeType } from '@/lib/workflows/types';

export function WorkflowNodePalette({
  onAdd,
}: {
  onAdd: (type: WorkflowNodeType, position?: { x: number; y: number }) => void;
}) {
  return (
    <aside className="hidden w-[17rem] shrink-0 flex-col border-s border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl md:flex">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">إضافة عقدة</h2>
        <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
          اسحب إلى اللوحة أو انقر للإضافة في المنتصف
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <WorkflowToolsCatalog
          onAdd={(type) =>
            onAdd(type, { x: 180, y: 140 + Math.random() * 120 })
          }
        />
      </div>
    </aside>
  );
}
