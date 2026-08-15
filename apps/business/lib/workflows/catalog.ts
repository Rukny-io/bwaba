import type { WorkflowNodeCatalogItem } from '@/lib/workflows/types';

export const WORKFLOW_NODE_CATALOG: WorkflowNodeCatalogItem[] = [
  {
    type: 'instagramTrigger',
    label: 'Instagram — رسالة',
    description: 'عند وصول رسالة أو تعليق جديد',
    category: 'triggers',
    iconId: 'instagram',
  },
  {
    type: 'messengerTrigger',
    label: 'Messenger — رسالة',
    description: 'عند وصول رسالة Messenger',
    category: 'triggers',
    iconId: 'messenger',
  },
  {
    type: 'webhookTrigger',
    label: 'Webhook',
    description: 'استقبال HTTP من نظام خارجي',
    category: 'triggers',
    iconId: 'webhook',
  },
  {
    type: 'aiReply',
    label: 'رد بالذكاء الاصطناعي',
    description: 'توليد رد بناءً على السياق',
    category: 'actions',
    iconId: 'ai',
  },
  {
    type: 'sendMessage',
    label: 'إرسال رسالة',
    description: 'إرسال رد عبر القناة المربوطة',
    category: 'actions',
    iconId: 'send',
  },
  {
    type: 'delay',
    label: 'انتظار',
    description: 'تأخير قبل الخطوة التالية',
    category: 'flow',
    iconId: 'delay',
  },
  {
    type: 'condition',
    label: 'شرط',
    description: 'تفرع حسب قاعدة (نعم / لا)',
    category: 'flow',
    iconId: 'condition',
  },
  {
    type: 'note',
    label: 'ملاحظة',
    description: 'نص حر — قابل للتكبير',
    category: 'misc',
    iconId: 'note',
  },
];

export const WORKFLOW_CATALOG_BY_CATEGORY = {
  triggers: WORKFLOW_NODE_CATALOG.filter((n) => n.category === 'triggers'),
  actions: WORKFLOW_NODE_CATALOG.filter((n) => n.category === 'actions'),
  flow: WORKFLOW_NODE_CATALOG.filter((n) => n.category === 'flow'),
  misc: WORKFLOW_NODE_CATALOG.filter((n) => n.category === 'misc'),
} as const;
