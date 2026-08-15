'use client';

import { useCallback, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import type { WorkflowEditorState } from '@/components/integrations/workflow/use-workflow-editor';
import { WorkflowToolsCatalog } from '@/components/integrations/workflow/workflow-tools-catalog';
import { dashboardTopTabsChipClass } from '@/components/app/nav-glass';
import type { WorkflowNodeType } from '@/lib/workflows/types';
import { cn } from '@/lib/utils';

export function WorkflowAddTools({ editor }: { editor: WorkflowEditorState }) {
  const [open, setOpen] = useState(false);

  const handleAdd = useCallback(
    (type: WorkflowNodeType) => {
      const offset = editor.nodes.length;
      editor.addNode(type, {
        x: 140 + (offset % 4) * 48,
        y: 120 + Math.floor(offset / 4) * 96,
      });
      setOpen(false);
    },
    [editor],
  );

  return (
    <div className="absolute top-3 start-3 z-30">
      <button
        type="button"
        aria-label="إضافة أدوات"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(dashboardTopTabsChipClass, 'gap-1.5')}
      >
        <Plus className="size-4" strokeWidth={2} />
        إضافة أدوات
        <ChevronDown className="size-3.5 opacity-70" strokeWidth={2} />
      </button>

      {open ? (
        <div className="mt-2 w-[min(100vw-2rem,18rem)] overflow-hidden rounded-2xl bg-[var(--surface)]">
          <div className="max-h-[min(52vh,22rem)] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <WorkflowToolsCatalog onAdd={handleAdd} compact />
          </div>
        </div>
      ) : null}
    </div>
  );
}
