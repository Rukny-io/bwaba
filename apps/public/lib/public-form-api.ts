import type { PublicForm } from '@/lib/forms-types';
import { API_PUBLIC_BASE, getBackendUrl } from '@/lib/config';

export async function fetchPublicForm(
  slug: string,
): Promise<PublicForm | null> {
  const base = getBackendUrl();

  try {
    const res = await fetch(
      `${base}/api/v1/forms/public/${encodeURIComponent(slug)}`,
      {
        cache: 'no-store',
        headers: {
          'X-Rukny-Skip-View-Track': '1',
        },
      },
    );

    if (!res.ok) return null;
    return (await res.json()) as PublicForm;
  } catch {
    return null;
  }
}

/** Browser → api.rukny.io through Cloudflare (geo headers preserved). */
export async function trackPublicFormView(slug: string): Promise<void> {
  try {
    await fetch(
      `${API_PUBLIC_BASE}/forms/public/${encodeURIComponent(slug)}/view`,
      { method: 'POST', keepalive: true },
    );
  } catch {
    /* non-blocking analytics */
  }
}

export async function submitPublicForm(
  slug: string,
  payload: {
    data: Record<string, unknown>;
    timeToComplete?: number;
    turnstileToken?: string;
  },
): Promise<{ ok: true } | { ok: false; message: string; code?: string }> {
  const idempotencyKey =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : undefined;

  try {
    const res = await fetch(
      `${API_PUBLIC_BASE}/forms/public/${encodeURIComponent(slug)}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idempotencyKey
            ? { 'Idempotency-Key': idempotencyKey }
            : {}),
        },
        body: JSON.stringify({
          data: payload.data,
          timeToComplete: payload.timeToComplete,
          turnstileToken: payload.turnstileToken,
          userAgent:
            typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        }),
      },
    );

    if (res.ok) return { ok: true };

    let message = 'تعذّر إرسال النموذج. حاول مرة أخرى.';
    let code: string | undefined;
    try {
      const body = (await res.json()) as {
        message?: string | string[];
        code?: string;
      };
      if (typeof body.message === 'string') message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join('، ');
      code = body.code;

      if (code === 'TURNSTILE_REQUIRED' || code === 'TURNSTILE_FAILED') {
        message = 'تعذّر التحقق من أنك لست روبوتاً. حاول مرة أخرى.';
      } else if (code === 'EMAIL_NOT_VERIFIED') {
        message = 'يرجى تأكيد البريد الإلكتروني برمز التحقق قبل الإرسال.';
      } else if (code === 'PHONE_NOT_VERIFIED') {
        message = 'يرجى تأكيد رقم الهاتف عبر WhatsApp قبل الإرسال.';
      } else if (code === 'OTP_INVALID') {
        message = 'رمز التحقق غير صحيح أو منتهي الصلاحية.';
      } else if (code === 'OTP_LOCKED') {
        message = 'تجاوزت عدد المحاولات. حاول لاحقاً.';
      } else if (code === 'OTP_RESEND_COOLDOWN') {
        message = 'انتظر قليلاً قبل طلب رمز جديد.';
      }
    } catch {
      // keep default
    }

    return { ok: false, message, code };
  } catch {
    return { ok: false, message: 'تعذّر الاتصال بالخادم.' };
  }
}

type ApiErrorBody = {
  message?: string | string[];
  code?: string;
  retryAfterSeconds?: number;
};

async function parseApiError(res: Response): Promise<ApiErrorBody> {
  try {
    return (await res.json()) as ApiErrorBody;
  } catch {
    return {};
  }
}

function extractErrorMessage(body: ApiErrorBody): string | undefined {
  if (typeof body.message === 'string') return body.message;
  if (Array.isArray(body.message) && body.message.length > 0) {
    return body.message.join(', ');
  }
  return undefined;
}

function mapVerificationError(body: ApiErrorBody, fallback: string) {
  const code = body.code;
  if (code === 'OTP_INVALID') return 'رمز التحقق غير صحيح أو منتهي الصلاحية.';
  if (code === 'OTP_LOCKED') return 'تجاوزت عدد المحاولات. حاول لاحقاً.';
  if (code === 'OTP_RESEND_COOLDOWN') {
    return body.retryAfterSeconds
      ? `انتظر ${body.retryAfterSeconds} ثانية قبل طلب رمز جديد.`
      : 'انتظر قليلاً قبل طلب رمز جديد.';
  }
  if (code === 'WHATSAPP_SEND_FAILED') {
    return (
      extractErrorMessage(body) ||
      'تعذّر إرسال رمز WhatsApp. تحقق من الرقم وحاول مرة أخرى.'
    );
  }
  const message = extractErrorMessage(body);
  if (message) return message;
  return fallback;
}

export async function sendEmailVerificationCode(
  slug: string,
  fieldId: string,
  email: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(
      `${API_PUBLIC_BASE}/forms/public/${encodeURIComponent(slug)}/verify-email/send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldId, email }),
      },
    );
    if (res.ok) return { ok: true };
    const body = await parseApiError(res);
    return {
      ok: false,
      message: mapVerificationError(body, 'تعذّر إرسال رمز التحقق.'),
    };
  } catch {
    return { ok: false, message: 'تعذّر الاتصال بالخادم.' };
  }
}

export async function confirmEmailVerificationCode(
  slug: string,
  email: string,
  code: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(
      `${API_PUBLIC_BASE}/forms/public/${encodeURIComponent(slug)}/verify-email/confirm`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      },
    );
    if (res.ok) return { ok: true };
    const body = await parseApiError(res);
    return {
      ok: false,
      message: mapVerificationError(body, 'رمز التحقق غير صحيح.'),
    };
  } catch {
    return { ok: false, message: 'تعذّر الاتصال بالخادم.' };
  }
}

export async function sendPhoneVerificationCode(
  slug: string,
  fieldId: string,
  phone: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(
      `${API_PUBLIC_BASE}/forms/public/${encodeURIComponent(slug)}/verify-phone/send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldId, phone }),
      },
    );
    if (res.ok) return { ok: true };
    const body = await parseApiError(res);
    return {
      ok: false,
      message: mapVerificationError(body, 'تعذّر إرسال رمز WhatsApp.'),
    };
  } catch {
    return { ok: false, message: 'تعذّر الاتصال بالخادم.' };
  }
}

export async function confirmPhoneVerificationCode(
  slug: string,
  phone: string,
  code: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(
      `${API_PUBLIC_BASE}/forms/public/${encodeURIComponent(slug)}/verify-phone/confirm`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      },
    );
    if (res.ok) return { ok: true };
    const body = await parseApiError(res);
    return {
      ok: false,
      message: mapVerificationError(body, 'رمز التحقق غير صحيح.'),
    };
  } catch {
    return { ok: false, message: 'تعذّر الاتصال بالخادم.' };
  }
}

export function isFormAvailable(form: PublicForm): boolean {
  if (form.status !== 'PUBLISHED') return false;

  const now = Date.now();
  if (form.opensAt && new Date(form.opensAt).getTime() > now) return false;
  if (form.closesAt && new Date(form.closesAt).getTime() < now) return false;

  return true;
}

export function formUnavailableMessage(form: PublicForm): string {
  if (form.status === 'CLOSED' || form.status === 'ARCHIVED') {
    return 'هذا النموذج مغلق ولا يقبل استجابات جديدة.';
  }
  if (form.status === 'DRAFT') {
    return 'هذا النموذج غير منشور بعد.';
  }
  if (form.opensAt && new Date(form.opensAt).getTime() > Date.now()) {
    return 'لم يُفتح هذا النموذج للاستجابات بعد.';
  }
  if (form.closesAt && new Date(form.closesAt).getTime() < Date.now()) {
    return 'انتهت فترة قبول الاستجابات لهذا النموذج.';
  }
  return 'هذا النموذج غير متاح حالياً.';
}
