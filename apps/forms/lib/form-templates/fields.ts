import { createDraftField, type DraftFormField } from '@/lib/form-field-utils';

function cloneFields(fields: DraftFormField[]): DraftFormField[] {
  return fields.map((field, order) => ({
    ...field,
    order,
    options: [...field.options],
  }));
}

export function contactBasicFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('TEXT', 0, { label: 'الاسم الكامل', required: true }),
    createDraftField('EMAIL', 1, { label: 'البريد الإلكتروني', required: true }),
    createDraftField('PHONE', 2, { label: 'رقم الهاتف' }),
    createDraftField('TEXTAREA', 3, {
      label: 'رسالتك',
      required: true,
      placeholder: 'اكتب استفسارك هنا…',
    }),
  ]);
}

export function contactSupportFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('HEADING', 0, { label: 'طلب دعم فني' }),
    createDraftField('TEXT', 1, { label: 'الاسم', required: true }),
    createDraftField('EMAIL', 2, { label: 'البريد', required: true }),
    createDraftField('SELECT', 3, {
      label: 'نوع المشكلة',
      required: true,
      options: ['تسجيل دخول', 'الدفع', 'تقني', 'أخرى'],
    }),
    createDraftField('TEXTAREA', 4, {
      label: 'وصف المشكلة',
      required: true,
    }),
  ]);
}

export function contactQuoteFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('TEXT', 0, { label: 'اسم الشركة / الشخص', required: true }),
    createDraftField('EMAIL', 1, { label: 'البريد', required: true }),
    createDraftField('PHONE', 2, { label: 'الهاتف', required: true }),
    createDraftField('SELECT', 3, {
      label: 'الخدمة المطلوبة',
      required: true,
      options: ['استشارة', 'تطوير', 'تصميم', 'صيانة'],
    }),
    createDraftField('TEXTAREA', 4, { label: 'تفاصيل الطلب', required: true }),
  ]);
}

export function surveyNpsFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('HEADING', 0, { label: 'قياس رضا العملاء (NPS)' }),
    createDraftField('NPS', 1, {
      label: 'ما مدى احتمال أن توصي بنا؟',
      required: true,
    }),
    createDraftField('TEXTAREA', 2, { label: 'ما السبب الرئيسي لتقييمك؟' }),
  ]);
}

export function surveySatisfactionFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('RATING', 0, { label: 'التقييم العام', required: true }),
    createDraftField('RADIO', 1, {
      label: 'جودة الخدمة',
      required: true,
      options: ['ممتاز', 'جيد', 'متوسط', 'ضعيف'],
    }),
    createDraftField('TEXTAREA', 2, { label: 'ملاحظات إضافية' }),
  ]);
}

export function surveyPollFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('HEADING', 0, { label: 'استطلاع رأي سريع' }),
    createDraftField('RADIO', 1, {
      label: 'ما الخيار الأنسب؟',
      required: true,
      options: ['الخيار أ', 'الخيار ب', 'الخيار ج'],
    }),
    createDraftField('MULTISELECT', 2, {
      label: 'اهتماماتك',
      options: ['منتجات', 'خدمات', 'فعاليات', 'محتوى'],
    }),
  ]);
}

export function surveyExitFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('HEADING', 0, { label: 'استبيان مغادرة' }),
    createDraftField('SELECT', 1, {
      label: 'سبب المغادرة',
      required: true,
      options: ['السعر', 'الخدمة', 'المنتج', 'بديل آخر'],
    }),
    createDraftField('TEXTAREA', 2, { label: 'كيف يمكننا التحسين؟' }),
  ]);
}

export function registrationEventFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('TEXT', 0, { label: 'الاسم', required: true }),
    createDraftField('EMAIL', 1, { label: 'البريد', required: true }),
    createDraftField('PHONE', 2, { label: 'الهاتف' }),
    createDraftField('DATE', 3, { label: 'تاريخ الحضور', required: true }),
    createDraftField('SELECT', 4, {
      label: 'تأكيد الحضور',
      required: true,
      options: ['سأحضر', 'ربما', 'لن أحضر'],
    }),
  ]);
}

export function registrationWorkshopFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('HEADING', 0, { label: 'تسجيل ورشة عمل' }),
    createDraftField('TEXT', 1, { label: 'الاسم الكامل', required: true }),
    createDraftField('EMAIL', 2, { label: 'البريد', required: true }),
    createDraftField('SELECT', 3, {
      label: 'مستوى الخبرة',
      required: true,
      options: ['مبتدئ', 'متوسط', 'متقدم'],
    }),
    createDraftField('TEXTAREA', 4, { label: 'ما الذي تريد تعلمه؟' }),
  ]);
}

export function registrationWebinarFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('TEXT', 0, { label: 'الاسم', required: true }),
    createDraftField('EMAIL', 1, { label: 'البريد', required: true }),
    createDraftField('TEXT', 2, { label: 'المسمى الوظيفي' }),
    createDraftField('TOGGLE', 3, { label: 'أرغب بتذكير قبل البث' }),
  ]);
}

export function orderProductFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('TEXT', 0, { label: 'المنتج', required: true }),
    createDraftField('NUMBER', 1, { label: 'الكمية', required: true }),
    createDraftField('TEXT', 2, { label: 'عنوان التوصيل', required: true }),
    createDraftField('TEXTAREA', 3, { label: 'ملاحظات الطلب' }),
  ]);
}

export function orderServiceFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('HEADING', 0, { label: 'طلب خدمة' }),
    createDraftField('TEXT', 1, { label: 'اسم العميل', required: true }),
    createDraftField('SELECT', 2, {
      label: 'نوع الخدمة',
      required: true,
      options: ['تركيب', 'صيانة', 'استشارة'],
    }),
    createDraftField('DATE', 3, { label: 'التاريخ المفضل', required: true }),
    createDraftField('TEXTAREA', 4, { label: 'تفاصيل إضافية' }),
  ]);
}

export function feedbackRatingFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('RATING', 0, { label: 'التقييم العام', required: true }),
    createDraftField('TEXTAREA', 1, {
      label: 'ما الذي يمكننا تحسينه؟',
      required: true,
    }),
  ]);
}

export function feedbackImprovementFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('HEADING', 0, { label: 'اقتراح تحسين' }),
    createDraftField('TEXT', 1, { label: 'الموضوع', required: true }),
    createDraftField('TEXTAREA', 2, {
      label: 'وصف الاقتراح',
      required: true,
    }),
    createDraftField('EMAIL', 3, { label: 'بريد للمتابعة' }),
  ]);
}

export function quizShortFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('HEADING', 0, { label: 'اختبار قصير' }),
    createDraftField('TEXT', 1, { label: 'السؤال 1', required: true }),
    createDraftField('RADIO', 2, {
      label: 'الإجابة 1',
      required: true,
      options: ['أ', 'ب', 'ج'],
    }),
    createDraftField('TEXT', 3, { label: 'السؤال 2', required: true }),
  ]);
}

export function quizKnowledgeFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('HEADING', 0, { label: 'اختبار معرفي' }),
    createDraftField('TEXT', 1, { label: 'الاسم', required: true }),
    createDraftField('RADIO', 2, {
      label: 'سؤال 1',
      required: true,
      options: ['صح', 'خطأ'],
    }),
    createDraftField('RADIO', 3, {
      label: 'سؤال 2',
      required: true,
      options: ['أ', 'ب', 'ج', 'د'],
    }),
  ]);
}

export function applicationJobFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('TEXT', 0, { label: 'الاسم الكامل', required: true }),
    createDraftField('EMAIL', 1, { label: 'البريد', required: true }),
    createDraftField('PHONE', 2, { label: 'الهاتف', required: true }),
    createDraftField('FILE', 3, {
      label: 'السيرة الذاتية',
      required: true,
    }),
    createDraftField('TEXTAREA', 4, {
      label: 'لماذا تتقدم؟',
      required: true,
    }),
  ]);
}

export function applicationInternshipFields(): DraftFormField[] {
  return cloneFields([
    createDraftField('HEADING', 0, { label: 'طلب تدريب' }),
    createDraftField('TEXT', 1, { label: 'الاسم', required: true }),
    createDraftField('EMAIL', 2, { label: 'البريد', required: true }),
    createDraftField('TEXT', 3, { label: 'الجامعة / التخصص', required: true }),
    createDraftField('TEXTAREA', 4, {
      label: 'خبراتك واهتماماتك',
      required: true,
    }),
  ]);
}

/** Legacy: one template per FormType (wizard field editor). */
export function legacyFieldsForFormType(
  formType: import('@/lib/forms-api').FormType,
): DraftFormField[] {
  switch (formType) {
    case 'CONTACT':
      return contactBasicFields();
    case 'SURVEY':
      return surveyPollFields();
    case 'REGISTRATION':
      return registrationEventFields();
    case 'ORDER':
      return orderProductFields();
    case 'FEEDBACK':
      return feedbackRatingFields();
    case 'QUIZ':
      return quizShortFields();
    case 'APPLICATION':
      return applicationJobFields();
    case 'OTHER':
    default:
      return cloneFields([
        createDraftField('TEXT', 0, { label: 'إجابتك', required: true }),
      ]);
  }
}
