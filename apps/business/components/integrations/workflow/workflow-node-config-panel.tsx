'use client';

import type { ReactNode } from 'react';
import type { WorkflowEditorState } from '@/components/integrations/workflow/use-workflow-editor';

export function WorkflowNodeConfigPanel({ editor }: { editor: WorkflowEditorState }) {
  const node = editor.selectedNode;
  if (!node) {
    return (
      <aside className="hidden w-72 shrink-0 flex-col border-s border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-xl xl:flex">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">خصائص العقدة</h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 text-center text-[12px] text-[var(--muted-foreground)]">
          اختر عقدة على اللوحة لتعديل إعداداتها
        </div>
      </aside>
    );
  }

  const config = node.data.config ?? {};

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-s border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-xl xl:flex">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">خصائص العقدة</h2>
        <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{node.data.label}</p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <Field label="العنوان">
          <input
            value={node.data.label}
            onChange={(event) =>
              editor.updateSelectedNodeConfig({ label: event.target.value })
            }
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          />
        </Field>

        {node.type === 'aiReply' ? (
          <Field label="Prompt">
            <textarea
              value={(config.prompt as string) ?? ''}
              onChange={(event) =>
                editor.updateSelectedNodeConfig({ config: { prompt: event.target.value } })
              }
              rows={4}
              className="w-full min-h-[6rem] resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </Field>
        ) : null}

        {node.type === 'sendMessage' ? (
          <Field label="قالب الرسالة">
            <textarea
              value={(config.template as string) ?? ''}
              onChange={(event) =>
                editor.updateSelectedNodeConfig({ config: { template: event.target.value } })
              }
              rows={3}
              className="w-full min-h-[5rem] resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </Field>
        ) : null}

        {node.type === 'delay' ? (
          <Field label="المدة (ثوانٍ)">
            <input
              type="number"
              min={1}
              value={(config.seconds as number) ?? 5}
              onChange={(event) =>
                editor.updateSelectedNodeConfig({
                  config: { seconds: Number(event.target.value) || 1 },
                })
              }
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </Field>
        ) : null}

        {node.type === 'condition' ? (
          <Field label="القاعدة">
            <textarea
              value={(config.rule as string) ?? ''}
              onChange={(event) =>
                editor.updateSelectedNodeConfig({ config: { rule: event.target.value } })
              }
              rows={3}
              className="w-full min-h-[5rem] resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </Field>
        ) : null}

        {node.type === 'note' ? (
          <Field label="نص الملاحظة">
            <textarea
              value={(config.text as string) ?? ''}
              onChange={(event) =>
                editor.updateSelectedNodeConfig({ config: { text: event.target.value } })
              }
              rows={5}
              className="w-full min-h-[7rem] resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </Field>
        ) : null}

        {node.type === 'webhookTrigger' ? (
          <Field label="مسار Webhook">
            <input
              value={(config.path as string) ?? ''}
              onChange={(event) =>
                editor.updateSelectedNodeConfig({ config: { path: event.target.value } })
              }
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              dir="ltr"
            />
          </Field>
        ) : null}
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-[var(--foreground)]">{label}</span>
      {children}
    </label>
  );
}
