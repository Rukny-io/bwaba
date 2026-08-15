'use client';

import type { NodeProps } from '@xyflow/react';
import { NodeResizer } from '@xyflow/react';
import type { WorkflowNodeData } from '@/lib/workflows/types';
import { CatalogNodeIcon } from '@/components/integrations/workflow/catalog-node-icon';
import { BaseWorkflowNode } from '@/components/integrations/workflow/nodes/base-workflow-node';

export function InstagramTriggerNode({ data, selected }: NodeProps) {
  const d = data as WorkflowNodeData;
  return (
    <BaseWorkflowNode
      title={d.label}
      subtitle={d.subtitle ?? 'Instagram'}
      selected={selected}
      accentClass="text-[#bc1888]"
      icon={<CatalogNodeIcon iconId="instagram" size={15} className="text-[#bc1888]" />}
      showTarget={false}
    >
      يُشغَّل عند رسالة أو تعليق جديد
    </BaseWorkflowNode>
  );
}

export function MessengerTriggerNode({ data, selected }: NodeProps) {
  const d = data as WorkflowNodeData;
  return (
    <BaseWorkflowNode
      title={d.label}
      subtitle={d.subtitle ?? 'Messenger'}
      selected={selected}
      accentClass="text-[#0084ff]"
      icon={<CatalogNodeIcon iconId="messenger" size={15} className="text-[#0084ff]" />}
      showTarget={false}
    >
      يُشغَّل عند رسالة Messenger
    </BaseWorkflowNode>
  );
}

export function WebhookTriggerNode({ data, selected }: NodeProps) {
  const d = data as WorkflowNodeData;
  return (
    <BaseWorkflowNode
      title={d.label}
      subtitle="POST webhook"
      selected={selected}
      icon={<CatalogNodeIcon iconId="webhook" />}
      showTarget={false}
    >
      {(d.config?.path as string) || '/hooks/your-id'}
    </BaseWorkflowNode>
  );
}

export function AiReplyNode({ data, selected }: NodeProps) {
  const d = data as WorkflowNodeData;
  return (
    <BaseWorkflowNode
      title={d.label}
      subtitle="OpenAI / Rukny AI"
      selected={selected}
      icon={<CatalogNodeIcon iconId="ai" />}
    >
      {(d.config?.prompt as string) || 'اقترح رداً مهذباً بالعربية'}
    </BaseWorkflowNode>
  );
}

export function SendMessageNode({ data, selected }: NodeProps) {
  const d = data as WorkflowNodeData;
  return (
    <BaseWorkflowNode
      title={d.label}
      subtitle="إرسال عبر القناة"
      selected={selected}
      icon={<CatalogNodeIcon iconId="send" />}
    >
      {(d.config?.template as string) || '{{aiReply}}'}
    </BaseWorkflowNode>
  );
}

export function DelayNode({ data, selected }: NodeProps) {
  const d = data as WorkflowNodeData;
  const seconds = (d.config?.seconds as number) ?? 5;
  return (
    <BaseWorkflowNode
      title={d.label}
      subtitle="انتظار"
      selected={selected}
      icon={<CatalogNodeIcon iconId="delay" />}
    >
      {seconds} ثانية
    </BaseWorkflowNode>
  );
}

export function ConditionNode({ data, selected }: NodeProps) {
  const d = data as WorkflowNodeData;
  return (
    <BaseWorkflowNode
      title={d.label}
      subtitle="تفرع"
      selected={selected}
      icon={<CatalogNodeIcon iconId="condition" />}
      outputs={[
        { id: 'yes', label: 'نعم' },
        { id: 'no', label: 'لا' },
      ]}
    >
      {(d.config?.rule as string) || 'يحتوي النص على كلمة «مرحبا»'}
    </BaseWorkflowNode>
  );
}

export function NoteNode({ data, selected }: NodeProps) {
  const d = data as WorkflowNodeData;
  return (
    <>
      <NodeResizer
        minWidth={160}
        minHeight={80}
        isVisible={selected}
        lineClassName="!border-[var(--primary)]"
        handleClassName="!size-2 !rounded-full !border !border-[var(--primary)] !bg-[var(--surface)]"
      />
      <div
        className={`h-full min-h-[80px] min-w-[160px] rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/50 p-3 text-[11px] leading-relaxed text-[var(--muted-foreground)] ${
          selected ? 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--background)]' : ''
        }`}
      >
        {(d.config?.text as string) || d.label || 'ملاحظة…'}
      </div>
    </>
  );
}
