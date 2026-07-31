import type { CreateFormPayload, FormFieldPayload, FormType } from '@/lib/forms/forms-api';

export interface FormLinkTemplate {
  id: string;
  title: string;
  description: string;
  formType: FormType;
  suggestedTitle: string;
  suggestedDescription?: string;
  fields: FormFieldPayload[];
}

export const FORM_LINK_TEMPLATES: FormLinkTemplate[] = [
  {
    id: 'contact-basic',
    title: 'تواصل بسيط',
    description: 'اسم، بريد، هاتف، ورسالة.',
    formType: 'CONTACT',
    suggestedTitle: 'تواصل معنا',
    suggestedDescription: 'يسعدنا استقبال استفساراتك ورسائلك.',
    fields: [
      { label: 'الاسم الكامل', type: 'TEXT', order: 0, required: true },
      { label: 'البريد الإلكتروني', type: 'EMAIL', order: 1, required: true },
      { label: 'رقم الهاتف', type: 'PHONE', order: 2 },
      {
        label: 'رسالتك',
        type: 'TEXTAREA',
        order: 3,
        required: true,
        placeholder: 'اكتب استفسارك هنا…',
      },
    ],
  },
  {
    id: 'contact-support',
    title: 'طلب دعم فني',
    description: 'بلاغ دعم مع تصنيف المشكلة.',
    formType: 'CONTACT',
    suggestedTitle: 'طلب دعم فني',
    fields: [
      { label: 'طلب دعم فني', type: 'HEADING', order: 0 },
      { label: 'الاسم', type: 'TEXT', order: 1, required: true },
      { label: 'البريد', type: 'EMAIL', order: 2, required: true },
      {
        label: 'نوع المشكلة',
        type: 'SELECT',
        order: 3,
        required: true,
        options: ['تسجيل دخول', 'الدفع', 'تقني', 'أخرى'],
      },
      { label: 'وصف المشكلة', type: 'TEXTAREA', order: 4, required: true },
    ],
  },
  {
    id: 'contact-quote',
    title: 'طلب عرض سعر',
    description: 'جمع بيانات العملاء وطلبات التسعير.',
    formType: 'CONTACT',
    suggestedTitle: 'طلب عرض سعر',
    fields: [
      { label: 'اسم الشركة / الشخص', type: 'TEXT', order: 0, required: true },
      { label: 'البريد', type: 'EMAIL', order: 1, required: true },
      { label: 'الهاتف', type: 'PHONE', order: 2, required: true },
      {
        label: 'الخدمة المطلوبة',
        type: 'SELECT',
        order: 3,
        required: true,
        options: ['استشارة', 'تطوير', 'تصميم', 'صيانة'],
      },
      { label: 'تفاصيل الطلب', type: 'TEXTAREA', order: 4, required: true },
    ],
  },
  {
    id: 'survey-nps',
    title: 'استبيان NPS',
    description: 'قياس احتمالية التوصية.',
    formType: 'SURVEY',
    suggestedTitle: 'استبيان NPS',
    fields: [
      { label: 'قياس رضا العملاء (NPS)', type: 'HEADING', order: 0 },
      { label: 'ما مدى احتمال أن توصي بنا؟', type: 'NPS', order: 1, required: true },
      { label: 'ما السبب الرئيسي لتقييمك؟', type: 'TEXTAREA', order: 2 },
    ],
  },
  {
    id: 'feedback-rating',
    title: 'تقييم الخدمة',
    description: 'تقييم بالنجوم وملاحظات.',
    formType: 'FEEDBACK',
    suggestedTitle: 'قيّم تجربتك',
    fields: [
      { label: 'التقييم العام', type: 'RATING', order: 0, required: true },
      {
        label: 'جودة الخدمة',
        type: 'RADIO',
        order: 1,
        required: true,
        options: ['ممتاز', 'جيد', 'متوسط', 'ضعيف'],
      },
      { label: 'ملاحظات إضافية', type: 'TEXTAREA', order: 2 },
    ],
  },
  {
    id: 'registration-event',
    title: 'تسجيل فعالية',
    description: 'حضور مؤتمر أو ورشة عمل.',
    formType: 'REGISTRATION',
    suggestedTitle: 'تسجيل في الفعالية',
    fields: [
      { label: 'الاسم الكامل', type: 'TEXT', order: 0, required: true },
      { label: 'البريد الإلكتروني', type: 'EMAIL', order: 1, required: true },
      { label: 'رقم الهاتف', type: 'PHONE', order: 2, required: true },
      {
        label: 'عدد الحضور',
        type: 'SELECT',
        order: 3,
        required: true,
        options: ['1', '2', '3', '4+'],
      },
    ],
  },
];

export function getFormLinkTemplate(id: string): FormLinkTemplate | undefined {
  return FORM_LINK_TEMPLATES.find((t) => t.id === id);
}

export function buildCreatePayloadFromTemplate(
  template: FormLinkTemplate,
  title?: string,
): CreateFormPayload {
  return {
    title: title?.trim() || template.suggestedTitle,
    description: template.suggestedDescription,
    type: template.formType,
    status: 'PUBLISHED',
    fields: template.fields,
  };
}
