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
  name: "Sara Al-Ahmad",
  email: "sara@rukny.io",
};

export const MOCK_MESSAGES: MailMessage[] = [
  {
    id: "m1",
    folder: "inbox",
    from: "Rukny Team",
    fromEmail: "hello@rukny.io",
    to: MOCK_USER.email,
    subject: "Welcome to Rukny Mail",
    preview: "This is a demo inbox. Messages are mock until the server is connected.",
    body: "Hi Sara,\n\nThis is a design preview of Rukny Mail with the same language as Business: white surfaces and rounded corners.\n\nReal messages will appear here later.",
    receivedAt: "2026-08-19T15:40:00.000Z",
    unread: true,
    starred: true,
  },
  {
    id: "m2",
    folder: "inbox",
    from: "Noura Al-Otaibi",
    fromEmail: "noura@studio.sa",
    to: MOCK_USER.email,
    subject: "Brand identity draft",
    preview: "Sent the updated file. Please review the colors before tomorrow’s meeting.",
    body: "Sara,\n\nI’ve attached the identity draft. We need confirmation on the primary blue to match Business.",
    receivedAt: "2026-08-19T12:10:00.000Z",
    unread: true,
    starred: false,
  },
  {
    id: "m3",
    folder: "inbox",
    from: "Sahab Billing",
    fromEmail: "billing@sahab.example",
    to: MOCK_USER.email,
    subject: "August invoice is ready",
    preview: "Your invoice has been issued. Due within 14 days.",
    body: "Your August invoice has been issued. You can download it from the account panel.",
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
    subject: "Re: Brand identity draft",
    preview: "Got it — I’ll reply after reviewing the colors with the team.",
    body: "Noura,\n\nReceived the draft. I’ll reply after reviewing the colors with the team.",
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
    subject: "Inbox notes",
    preview: "Draft: we need faster search in the list…",
    body: "Incomplete draft.",
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
    return new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function formatMailDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
