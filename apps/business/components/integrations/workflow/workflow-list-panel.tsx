'use client';

import type { WorkflowEditorState } from '@/components/integrations/workflow/use-workflow-editor';

export function WorkflowListPanel({ editor }: { editor: WorkflowEditorState }) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-e border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-xl lg:flex">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">سير العمل</h2>
        <button
          type="button"
          onClick={() => void editor.createNewWorkflow()}
          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--primary)] hover:bg-[var(--surface-secondary)]"
        >
          + جديد
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {editor.workflows.map((workflow) => {
          const active = workflow.id === editor.activeWorkflowId;
          return (
            <button
              key={workflow.id}
              type="button"
              onClick={() => void editor.selectWorkflow(workflow.id)}
              className={`mb-1 flex w-full flex-col rounded-2xl px-3 py-2.5 text-start transition-colors ${
                active
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'hover:bg-[var(--surface-secondary)]'
              }`}
            >
              <span className="truncate text-[12px] font-semibold">{workflow.name}</span>
              <span
                className={`mt-0.5 text-[10px] ${
                  active ? 'text-[var(--background)]/75' : 'text-[var(--muted-foreground)]'
                }`}
              >
                {new Date(workflow.updatedAt).toLocaleDateString('ar-IQ')}
              </span>
            </button>
          );
        })}
      </div>

      {editor.activeWorkflowId ? (
        <div className="border-t border-[var(--border)] p-2">
          <button
            type="button"
            onClick={() => void editor.removeActiveWorkflow()}
            className="w-full rounded-xl px-3 py-2 text-[11px] font-semibold text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_8%,transparent)]"
          >
            حذف السير الحالي
          </button>
        </div>
      ) : null}
    </aside>
  );
}
