import { ConfigService } from '@nestjs/config';
import { SupportTicketStatus } from '@prisma/client';

export type SupportTicketNotifyEvent =
  | 'CREATED'
  | 'REPLY'
  | 'STATUS_CHANGED'
  | 'STARTED'
  | 'USER_REPLIED';

export interface SupportTicketEmailPayload {
  ticketNumber: string;
  subject: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ticketUrl: string;
  preview?: string;
}

const STATUS_COPY: Record<
  SupportTicketStatus,
  { ar: { title: string; message: string; emailHeadline: string; emailBody: string }; en: { title: string; message: string; emailHeadline: string; emailBody: string } }
> = {
  OPEN: {
    ar: {
      title: 'تذكرة الدعم مفتوحة',
      message: 'تذكرتك قيد المتابعة',
      emailHeadline: 'تذكرتك لا تزال مفتوحة',
      emailBody: 'لا يزال فريق الدعم يتابع طلبك.',
    },
    en: {
      title: 'Support ticket open',
      message: 'Your ticket is being tracked',
      emailHeadline: 'Your ticket is still open',
      emailBody: 'Our support team is still following up on your request.',
    },
  },
  IN_PROGRESS: {
    ar: {
      title: 'بدأ فريق الدعم العمل على تذكرتك',
      message: 'جارٍ معالجة تذكرتك الآن',
      emailHeadline: 'بدأ فريق الدعم معالجة تذكرتك',
      emailBody: 'بدأ أحد أعضاء فريق الدعم العمل على تذكرتك. سنبلغك عند وجود تحديث.',
    },
    en: {
      title: 'Support started working on your ticket',
      message: 'Your ticket is now in progress',
      emailHeadline: 'We started working on your ticket',
      emailBody: 'A support agent has started reviewing your ticket. We will notify you when there is an update.',
    },
  },
  WAITING_ON_USER: {
    ar: {
      title: 'بانتظار ردك',
      message: 'يرجى مراجعة التذكرة والرد',
      emailHeadline: 'نحتاج ردك على التذكرة',
      emailBody: 'أرسل فريق الدعم رداً وينتظر ردك لمتابعة الحل.',
    },
    en: {
      title: 'Waiting for your reply',
      message: 'Please review the ticket and respond',
      emailHeadline: 'We need your reply',
      emailBody: 'Support has replied and is waiting for your response to continue.',
    },
  },
  RESOLVED: {
    ar: {
      title: 'تم حل تذكرتك',
      message: 'اعتبرنا المشكلة محلولة',
      emailHeadline: 'تم حل تذكرتك',
      emailBody: 'تم وضع علامة "تم الحل" على تذكرتك. إذا احتجت مساعدة إضافية يمكنك إعادة فتحها خلال 7 أيام.',
    },
    en: {
      title: 'Your ticket was resolved',
      message: 'We marked your issue as resolved',
      emailHeadline: 'Your ticket has been resolved',
      emailBody: 'Your ticket was marked as resolved. You can reopen it within 7 days if you still need help.',
    },
  },
  CLOSED: {
    ar: {
      title: 'تم إغلاق تذكرتك',
      message: 'أُغلقت التذكرة',
      emailHeadline: 'تم إغلاق تذكرتك',
      emailBody: 'تم إغلاق تذكرة الدعم. شكراً لتواصلك معنا.',
    },
    en: {
      title: 'Your ticket was closed',
      message: 'The ticket has been closed',
      emailHeadline: 'Your ticket has been closed',
      emailBody: 'Your support ticket has been closed. Thank you for contacting us.',
    },
  },
};

export function resolveAccountsBaseUrl(config: ConfigService): string {
  const raw =
    config.get<string>('ACCOUNTS_URL') ||
    config.get<string>('AUTH_FRONTEND_URL') ||
    config.get<string>('FRONTEND_URL') ||
    'http://localhost:3005';
  return raw.replace(/\/$/, '');
}

export function buildSupportTicketUrl(
  config: ConfigService,
  ticketId: string,
): string {
  return `${resolveAccountsBaseUrl(config)}/manage/support/tickets/${ticketId}`;
}

export function pickLocale(context: unknown): 'ar' | 'en' {
  if (
    context &&
    typeof context === 'object' &&
    'locale' in context &&
    (context as { locale?: string }).locale === 'en'
  ) {
    return 'en';
  }
  return 'ar';
}

export function getStatusNotificationCopy(
  status: SupportTicketStatus,
  locale: 'ar' | 'en',
) {
  return STATUS_COPY[status][locale];
}

export function getCreatedCopy(locale: 'ar' | 'en', ticketNumber: string) {
  if (locale === 'en') {
    return {
      title: 'Support ticket received',
      message: `We received your ticket ${ticketNumber}`,
      emailHeadline: 'Your support ticket was received',
      emailBody:
        'Thank you for contacting us. Our team will review your request and get back to you soon.',
      emailSubject: `Support ticket received — ${ticketNumber}`,
      ctaLabel: 'View ticket',
    };
  }
  return {
    title: 'تم استلام تذكرة الدعم',
    message: `تم استلام تذكرتك ${ticketNumber}`,
    emailHeadline: 'تم استلام تذكرة الدعم',
    emailBody:
      'شكراً لتواصلك معنا. سيقوم فريق الدعم بمراجعة طلبك والرد عليك في أقرب وقت.',
    emailSubject: `تم استلام تذكرة الدعم — ${ticketNumber}`,
    ctaLabel: 'عرض التذكرة',
  };
}

export function getReplyCopy(locale: 'ar' | 'en', ticketNumber: string) {
  if (locale === 'en') {
    return {
      title: 'New reply on your support ticket',
      message: `Support replied to ticket ${ticketNumber}`,
      emailHeadline: 'You have a new support reply',
      emailBody: 'Our support team sent a new reply. Sign in to read it and continue the conversation.',
      emailSubject: `New reply — ${ticketNumber}`,
      ctaLabel: 'Read reply',
    };
  }
  return {
    title: 'رد جديد على تذكرة الدعم',
    message: `تم الرد على تذكرة ${ticketNumber}`,
    emailHeadline: 'لديك رد جديد من فريق الدعم',
    emailBody: 'أرسل فريق الدعم رداً جديداً. سجّل الدخول لقراءته ومتابعة المحادثة.',
    emailSubject: `رد جديد على التذكرة — ${ticketNumber}`,
    ctaLabel: 'قراءة الرد',
  };
}

export function buildSupportTicketEmailHtml(
  payload: SupportTicketEmailPayload,
): string {
  const preview = payload.preview || payload.headline;
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${payload.headline}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b;">
  <div style="display:none;max-height:0;overflow:hidden;">${preview}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;border:1px solid #e4e4e7;overflow:hidden;">
          <tr>
            <td style="padding:28px 24px 8px;text-align:center;">
              <div style="font-size:20px;font-weight:600;color:#18181b;">Rukny</div>
              <div style="font-size:12px;color:#71717a;margin-top:4px;">${payload.ticketNumber}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 0;">
              <h1 style="margin:0 0 12px;font-size:20px;line-height:1.4;color:#18181b;">${payload.headline}</h1>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#52525b;">${payload.body}</p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#71717a;"><strong>الموضوع:</strong> ${payload.subject}</p>
              <a href="${payload.ticketUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-size:14px;font-weight:600;">${payload.ctaLabel}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;color:#a1a1aa;font-size:12px;line-height:1.6;text-align:center;">
              إذا لم تطلب هذا الإشعار، تواصل معنا عبر <a href="mailto:support@rukny.io" style="color:#52525b;">support@rukny.io</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
