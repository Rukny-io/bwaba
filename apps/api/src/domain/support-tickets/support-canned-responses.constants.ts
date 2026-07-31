export type SupportCannedResponseCategory =
  | 'GREETING'
  | 'INFO_REQUEST'
  | 'RESOLUTION'
  | 'CLOSING'
  | 'BILLING'
  | 'FOLLOW_UP';

export interface SupportCannedResponse {
  id: string;
  category: SupportCannedResponseCategory;
  title: string;
  body: string;
  locale: 'en' | 'ar';
}

/** Seed templates — ready to extend or replace with AI-generated drafts later. */
export const SUPPORT_CANNED_RESPONSES: SupportCannedResponse[] = [
  {
    id: 'greeting-en',
    category: 'GREETING',
    title: 'Acknowledge receipt',
    body: 'Thank you for contacting Rukny support. We have received your ticket and will review it shortly.',
    locale: 'en',
  },
  {
    id: 'greeting-ar',
    category: 'GREETING',
    title: 'تأكيد الاستلام',
    body: 'شكراً لتواصلك مع دعم ركني. استلمنا تذكرتك وسنراجعها في أقرب وقت.',
    locale: 'ar',
  },
  {
    id: 'invoice-en',
    category: 'INFO_REQUEST',
    title: 'Request invoice number',
    body: 'Could you please share your invoice or payment reference number so we can locate the transaction?',
    locale: 'en',
  },
  {
    id: 'invoice-ar',
    category: 'INFO_REQUEST',
    title: 'طلب رقم الفاتورة',
    body: 'هل يمكنك إرسال رقم الفاتورة أو مرجع الدفع حتى نتمكن من تتبع العملية؟',
    locale: 'ar',
  },
  {
    id: 'screenshot-en',
    category: 'INFO_REQUEST',
    title: 'Request screenshot',
    body: 'To help us investigate, please attach a screenshot of the error or the page where you see the issue.',
    locale: 'en',
  },
  {
    id: 'screenshot-ar',
    category: 'INFO_REQUEST',
    title: 'طلب لقطة شاشة',
    body: 'لمساعدتنا في التحقيق، يرجى إرفاق لقطة شاشة للخطأ أو للصفحة التي تظهر فيها المشكلة.',
    locale: 'ar',
  },
  {
    id: 'resolved-en',
    category: 'RESOLUTION',
    title: 'Issue resolved',
    body: 'We have applied the fix on our side. Please sign out and sign in again, then let us know if everything works as expected.',
    locale: 'en',
  },
  {
    id: 'resolved-ar',
    category: 'RESOLUTION',
    title: 'تم حل المشكلة',
    body: 'قمنا بتطبيق الإصلاح من طرفنا. يرجى تسجيل الخروج ثم الدخول مجدداً، وأخبرنا إن كان كل شيء يعمل بشكل صحيح.',
    locale: 'ar',
  },
  {
    id: 'billing-en',
    category: 'BILLING',
    title: 'Subscription renewed',
    body: 'Your subscription has been renewed successfully. You should see the updated plan within a few minutes.',
    locale: 'en',
  },
  {
    id: 'billing-ar',
    category: 'BILLING',
    title: 'تم تجديد الاشتراك',
    body: 'تم تجديد اشتراكك بنجاح. يفترض أن يظهر التحديث خلال دقائق قليلة.',
    locale: 'ar',
  },
  {
    id: 'closing-en',
    category: 'CLOSING',
    title: 'Close if resolved',
    body: 'If your issue is resolved, you may close this ticket from your account. We are here if you need anything else.',
    locale: 'en',
  },
  {
    id: 'closing-ar',
    category: 'CLOSING',
    title: 'إغلاق عند الحل',
    body: 'إذا تم حل مشكلتك يمكنك إغلاق التذكرة من حسابك. نحن هنا إذا احتجت أي مساعدة أخرى.',
    locale: 'ar',
  },
  {
    id: 'delay-en',
    category: 'GREETING',
    title: 'Apologize for delay',
    body: 'Thank you for your patience. We apologize for the delay and are working on your request right now.',
    locale: 'en',
  },
  {
    id: 'delay-ar',
    category: 'GREETING',
    title: 'اعتذار عن التأخير',
    body: 'شكراً لصبرك. نعتذر عن التأخير ونعمل على طلبك حالياً.',
    locale: 'ar',
  },
  {
    id: 'verify-email-en',
    category: 'INFO_REQUEST',
    title: 'Confirm account email',
    body: 'Could you please confirm the email address linked to your Rukny account so we can verify ownership?',
    locale: 'en',
  },
  {
    id: 'verify-email-ar',
    category: 'INFO_REQUEST',
    title: 'تأكيد البريد',
    body: 'هل يمكنك تأكيد البريد الإلكتروني المرتبط بحسابك في ركني حتى نتمكن من التحقق؟',
    locale: 'ar',
  },
  {
    id: 'reproduce-en',
    category: 'INFO_REQUEST',
    title: 'Steps to reproduce',
    body: 'Please describe the exact steps you took before the issue occurred, including the browser or device you are using.',
    locale: 'en',
  },
  {
    id: 'reproduce-ar',
    category: 'INFO_REQUEST',
    title: 'خطوات إعادة المشكلة',
    body: 'يرجى وصف الخطوات التي قمت بها قبل ظهور المشكلة، بما في ذلك المتصفح أو الجهاز المستخدم.',
    locale: 'ar',
  },
  {
    id: 'escalate-en',
    category: 'INFO_REQUEST',
    title: 'Escalated to engineering',
    body: 'We have escalated your case to our engineering team. We will update you as soon as we have more information.',
    locale: 'en',
  },
  {
    id: 'escalate-ar',
    category: 'INFO_REQUEST',
    title: 'رفع للفريق التقني',
    body: 'رفعنا حالتك إلى الفريق التقني. سنبلغك فور توفر أي معلومات جديدة.',
    locale: 'ar',
  },
  {
    id: 'cache-en',
    category: 'RESOLUTION',
    title: 'Clear cache & retry',
    body: 'Please clear your browser cache or try an incognito window, then attempt the action again and let us know the result.',
    locale: 'en',
  },
  {
    id: 'cache-ar',
    category: 'RESOLUTION',
    title: 'مسح الكاش وإعادة المحاولة',
    body: 'يرجى مسح ذاكرة التخزين المؤقت للمتصفح أو استخدام نافذة خاصة، ثم إعادة المحاولة وإخبارنا بالنتيجة.',
    locale: 'ar',
  },
  {
    id: 'password-en',
    category: 'RESOLUTION',
    title: 'Password reset help',
    body: 'You can reset your password from the sign-in page using “Forgot password”. If the email does not arrive, check spam or tell us and we will assist.',
    locale: 'en',
  },
  {
    id: 'password-ar',
    category: 'RESOLUTION',
    title: 'مساعدة إعادة كلمة المرور',
    body: 'يمكنك إعادة تعيين كلمة المرور من صفحة تسجيل الدخول عبر «نسيت كلمة المرور». إن لم يصل البريد، تحقق من الرسائل غير المرغوبة أو أخبرنا لنساعدك.',
    locale: 'ar',
  },
  {
    id: 'refund-en',
    category: 'BILLING',
    title: 'Refund in progress',
    body: 'Your refund request has been submitted. It may take 5–10 business days to appear on your payment method depending on your bank.',
    locale: 'en',
  },
  {
    id: 'refund-ar',
    category: 'BILLING',
    title: 'استرداد قيد المعالجة',
    body: 'تم تقديم طلب الاسترداد. قد يستغرق ظهور المبلغ من 5 إلى 10 أيام عمل حسب البنك أو مزود الدفع.',
    locale: 'ar',
  },
  {
    id: 'plan-change-en',
    category: 'BILLING',
    title: 'Plan change applied',
    body: 'Your plan change has been applied. Please refresh your account page to see the updated subscription details.',
    locale: 'en',
  },
  {
    id: 'plan-change-ar',
    category: 'BILLING',
    title: 'تم تغيير الباقة',
    body: 'تم تطبيق تغيير الباقة. يرجى تحديث صفحة حسابك لرؤية تفاصيل الاشتراك المحدّثة.',
    locale: 'ar',
  },
  {
    id: 'follow-up-en',
    category: 'FOLLOW_UP',
    title: 'Follow up in 24h',
    body: 'We will follow up within 24 hours. If you have any updates in the meantime, feel free to reply here.',
    locale: 'en',
  },
  {
    id: 'follow-up-ar',
    category: 'FOLLOW_UP',
    title: 'متابعة خلال 24 ساعة',
    body: 'سنتابع معك خلال 24 ساعة. إن كان لديك أي تحديث قبل ذلك، يمكنك الرد هنا.',
    locale: 'ar',
  },
  {
    id: 'anything-else-en',
    category: 'CLOSING',
    title: 'Anything else?',
    body: 'Is there anything else we can help you with today?',
    locale: 'en',
  },
  {
    id: 'anything-else-ar',
    category: 'CLOSING',
    title: 'هل تحتاج مساعدة أخرى؟',
    body: 'هل هناك أي شيء آخر يمكننا مساعدتك به اليوم؟',
    locale: 'ar',
  },
  {
    id: 'received-info-en',
    category: 'FOLLOW_UP',
    title: 'Info received',
    body: 'Thank you — we received the details you shared. We are reviewing them and will get back to you shortly.',
    locale: 'en',
  },
  {
    id: 'received-info-ar',
    category: 'FOLLOW_UP',
    title: 'استلمنا المعلومات',
    body: 'شكراً — استلمنا التفاصيل التي أرسلتها. نراجعها حالياً وسنرد عليك قريباً.',
    locale: 'ar',
  },
];

export function listCannedResponses(locale?: 'en' | 'ar'): SupportCannedResponse[] {
  if (!locale) return SUPPORT_CANNED_RESPONSES;
  return SUPPORT_CANNED_RESPONSES.filter((item) => item.locale === locale);
}
