'use client';

import { Button } from '@heroui/react';
import {
  Plus,
  Redo2,
  Save,
  Trash2,
  Undo2,
  ZoomIn,
} from 'lucide-react';
import type { WorkflowEditorState } from '@/components/integrations/workflow/use-workflow-editor';

export function WorkflowToolbar({ editor }: { editor: WorkflowEditorState }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)]/85 px-3 py-2 backdrop-blur-xl sm:px-4">
      <input
        value={editor.workflowName}
        onChange={(event) => {
          editor.setWorkflowName(event.target.value);
        }}
        className="min-w-[10rem] flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)] sm:max-w-xs"
        aria-label="اسم سير العمل"
      />

      {editor.dirty ? (
        <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-600">
          غير محفوظ
        </span>
      ) : null}

      <div className="ms-auto flex flex-wrap items-center gap-1.5">
        <Button
          size="sm"
          variant="ghost"
          onPress={() => editor.undo()}
          aria-label="تراجع"
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onPress={() => editor.redo()}
          aria-label="إعادة"
        >
          <Redo2 className="size-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onPress={() => editor.deleteSelectedNode()}
          isDisabled={!editor.selectedNodeId}
          aria-label="حذف العقدة"
        >
          <Trash2 className="size-4" />
        </Button>
        <Button size="sm" variant="ghost" onPress={() => editor.createNewWorkflow()}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">جديد</span>
        </Button>
        <Button
          size="sm"
          variant="primary"
          onPress={() => void editor.saveWorkflow()}
          isDisabled={editor.saving || !editor.activeWorkflowId}
        >
          <Save className="size-4" />
          {editor.saving ? 'جاري الحفظ…' : 'حفظ'}
        </Button>
      </div>
    </div>
  );
}

export function WorkflowToolbarHint() {
  return (
    <div className="pointer-events-none absolute bottom-3 start-3 z-10 hidden rounded-full border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-1.5 text-[10px] text-[var(--muted-foreground)] shadow-sm backdrop-blur md:flex md:items-center md:gap-1.5">
      <ZoomIn className="size-3.5" />
      اسحب للتحريك · عجلة الفأرة للتكبير · Backspace للحذف
    </div>
  );
}
