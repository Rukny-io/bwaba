import type { NodeTypes } from '@xyflow/react';
import {
  AiReplyNode,
  ConditionNode,
  DelayNode,
  InstagramTriggerNode,
  MessengerTriggerNode,
  NoteNode,
  SendMessageNode,
  WebhookTriggerNode,
} from '@/components/integrations/workflow/nodes/workflow-nodes';

export const workflowNodeTypes: NodeTypes = {
  instagramTrigger: InstagramTriggerNode,
  messengerTrigger: MessengerTriggerNode,
  webhookTrigger: WebhookTriggerNode,
  aiReply: AiReplyNode,
  sendMessage: SendMessageNode,
  delay: DelayNode,
  condition: ConditionNode,
  note: NoteNode,
};
