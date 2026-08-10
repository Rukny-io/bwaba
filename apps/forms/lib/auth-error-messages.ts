interface AuthErrorCopy {
  title: string;
  description: string;
}

const ERROR_MAP: Record<string, AuthErrorCopy> = {
  'invalid or expired authorization code': {
    title: 'انتهت صلاحية رابط الدخول',
    description:
      'رابط المصادقة غير صالح أو استُخدم مسبقاً. ابدأ تسجيل الدخول من جديد.',
  },
  'token refresh in progress': {
    title: 'جارٍ تحديث الجلسة',
    description: 'انتظر لحظة ثم أعد المحاولة.',
  },
};

export function formatAuthError(message?: string | null): AuthErrorCopy {
  const raw = message?.trim();
  if (!raw) {
    return {
      title: 'تعذر تسجيل الدخول',
      description: 'حدث خطأ غير متوقع أثناء تسجيل الدخول. حاول مرة أخرى.',
    };
  }

  const normalized = raw.toLowerCase();
  const mapped = ERROR_MAP[normalized];
  if (mapped) return mapped;

  const isEnglish = /^[\x00-\x7F]+$/.test(raw);
  if (isEnglish) {
    return {
      title: 'تعذر تسجيل الدخول',
      description:
        'لم نتمكن من إكمال تسجيل الدخول. أعد المحاولة من صفحة الدخول.',
    };
  }

  return {
    title: 'تعذر تسجيل الدخول',
    description: raw,
  };
}
