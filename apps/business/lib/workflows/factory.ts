import type { WorkflowNodeType } from '@/lib/workflows/types';
import { WORKFLOW_NODE_CATALOG } from '@/lib/workflows/catalog';

export function createWorkflowNodeId(type: WorkflowNodeType) {
  return `${type}-${crypto.randomUUID().slice(0, 8)}`;
}

export function buildDefaultNodeData(type: WorkflowNodeType) {
  const item = WORKFLOW_NODE_CATALOG.find((entry) => entry.type === type);
  const label = item?.label ?? type;

  const configByType: Record<string, Record<string, unknown>> = {
    webhookTrigger: { path: '/hooks/new' },
    aiReply: { prompt: 'اقترح رداً مهذباً بالعربية' },
    sendMessage: { template: '{{aiReply}}' },
    delay: { seconds: 5 },
    condition: { rule: 'يحتوي النص على «مرحبا»' },
    note: { text: 'اكتب ملاحظتك هنا…' },
  };

  return {
    label,
    subtitle: item?.description,
    config: configByType[type] ?? {},
  };
}

export function createStarterWorkflowDefinition() {
  return {
    nodes: [
      {
        id: 'instagramTrigger-start',
        type: 'instagramTrigger' as const,
        position: { x: 80, y: 120 },
        data: buildDefaultNodeData('instagramTrigger'),
      },
      {
        id: 'aiReply-start',
        type: 'aiReply' as const,
        position: { x: 80, y: 280 },
        data: buildDefaultNodeData('aiReply'),
      },
      {
        id: 'sendMessage-start',
        type: 'sendMessage' as const,
        position: { x: 80, y: 440 },
        data: buildDefaultNodeData('sendMessage'),
      },
    ],
    edges: [
      {
        id: 'e1',
        source: 'instagramTrigger-start',
        target: 'aiReply-start',
        sourceHandle: 'out',
        targetHandle: 'in',
      },
      {
        id: 'e2',
        source: 'aiReply-start',
        target: 'sendMessage-start',
        sourceHandle: 'out',
        targetHandle: 'in',
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}
