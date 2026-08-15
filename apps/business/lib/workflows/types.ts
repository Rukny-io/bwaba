import type { Edge, Node, Viewport } from '@xyflow/react';

export type WorkflowNodeType =
  | 'instagramTrigger'
  | 'messengerTrigger'
  | 'webhookTrigger'
  | 'aiReply'
  | 'sendMessage'
  | 'delay'
  | 'condition'
  | 'note';

export type WorkflowNodeData = {
  label: string;
  subtitle?: string;
  config?: Record<string, unknown>;
};

export type WorkflowDefinition = {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  viewport?: Viewport;
};

export type WorkflowSummary = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
};

export type WorkflowDetail = WorkflowSummary & {
  definition: WorkflowDefinition;
};

export type WorkflowNodeCatalogItem = {
  type: WorkflowNodeType;
  label: string;
  description: string;
  category: 'triggers' | 'actions' | 'flow' | 'misc';
  iconId: 'instagram' | 'messenger' | 'webhook' | 'ai' | 'send' | 'delay' | 'condition' | 'note';
};
