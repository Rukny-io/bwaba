export type MailFolderId = "inbox" | "starred" | "sent" | "drafts" | "trash";

export type MailMessage = {
  id: string;
  folder: MailFolderId;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  receivedAt: string;
  unread: boolean;
  starred: boolean;
};

export const MOCK_USER = {
  name: "سارة الأحمد",
  email: "sara@rukny.io",
};

export const MOCK_MESSAGES: MailMessage[] = [
  {
    id: "m1",
    folder: "inbox",
    from: "فريق ركني",
    fromEmail: "hello@rukny.io",
    to: MOCK_USER.email,
    subject: "مرحباً بك في ركني Mail",
    preview: "هذه واجهة تجريبية للصندوق. الرسائل وهمية حتى نربط الخادم.",
    body: "أهلاً سارة،\n\nهذه نسخة تصميمية من ركني Mail بنفس لغة Business: أسطح بيضاء، زوايا دائرية، وعربية من اليمين لليسار.\n\nستظهر الرسائل الحقيقية هنا لاحقاً.",
    receivedAt: "2026-08-19T15:40:00.000Z",
    unread: true,
    starred: true,
  },
  {
    id: "m2",
    folder: "inbox",
    from: "نورة العتيبي",
    fromEmail: "noura@studio.sa",
    to: MOCK_USER.email,
    subject: "مسودة الهوية البصرية",
    preview: "أرسلت الملف المحدّث. راجعي الألوان قبل اجتماع الغد.",
    body: "سارة،\n\nأرفقت مسودة الهوية. نحتاج تأكيداً على الأزرق الأساسي ليطابق Business.",
    receivedAt: "2026-08-19T12:10:00.000Z",
    unread: true,
    starred: false,
  },
  {
    id: "m3",
    folder: "inbox",
    from: "فواتير سحاب",
    fromEmail: "billing@sahab.example",
    to: MOCK_USER.email,
    subject: "فاتورة أغسطس جاهزة",
    preview: "تم إصدار فاتورتك. الاستحقاق خلال 14 يوماً.",
    body: "تم إصدار فاتورة أغسطس. يمكنك تحميلها من لوحة الحساب.",
    receivedAt: "2026-08-18T09:00:00.000Z",
    unread: false,
    starred: false,
  },
  {
    id: "m4",
    folder: "sent",
    from: MOCK_USER.name,
    fromEmail: MOCK_USER.email,
    to: "noura@studio.sa",
    subject: "Re: مسودة الهوية البصرية",
    preview: "تمام، سأرد بعد مراجعة الألوان مع الفريق.",
    body: "نورة،\n\nوصلت المسودة. سأرد بعد مراجعة الألوان مع الفريق.",
    receivedAt: "2026-08-19T13:22:00.000Z",
    unread: false,
    starred: false,
  },
  {
    id: "m5",
    folder: "drafts",
    from: MOCK_USER.name,
    fromEmail: MOCK_USER.email,
    to: "hello@rukny.io",
    subject: "ملاحظات على الصندوق",
    preview: "مسودة: نحتاج بحثاً أسرع في القائمة…",
    body: "مسودة غير مكتملة.",
    receivedAt: "2026-08-17T18:05:00.000Z",
    unread: false,
    starred: false,
  },
];

export function messagesForFolder(folder: MailFolderId): MailMessage[] {
  if (folder === "starred") {
    return MOCK_MESSAGES.filter((message) => message.starred);
  }
  return MOCK_MESSAGES.filter((message) => message.folder === folder);
}

export function unreadCount(folder: MailFolderId): number {
  return messagesForFolder(folder).filter((message) => message.unread).length;
}

export function formatMailTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function formatMailDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
