'use client';

import { Skeleton } from '@heroui/react';
import { WorkflowAddTools } from '@/components/integrations/workflow/workflow-add-tools';
import { WorkflowCanvas } from '@/components/integrations/workflow/workflow-canvas';
import { useWorkflowEditor } from '@/components/integrations/workflow/use-workflow-editor';

const canvasFrameClass =
  'relative min-h-0 flex-1 overflow-hidden rounded-3xl border border-gray-200 bg-[var(--surface)]';

export function IntegrationsWorkflowEditor() {
  const editor = useWorkflowEditor();

  if (editor.loading) {
    return <Skeleton className={`${canvasFrameClass} min-h-[20rem]`} />;
  }

  return (
    <div className={canvasFrameClass}>
      <WorkflowCanvas editor={editor} />
      <WorkflowAddTools editor={editor} />
    </div>
  );
}
