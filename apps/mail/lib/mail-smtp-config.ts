/** Public SMTP endpoints shown in Connect apps & devices and developer docs. */

export const MAILBOX_SMTP_HOST =
  process.env.NEXT_PUBLIC_MAILBOX_SMTP_HOST?.trim() || "smtp.mail.rukny.io";

export const MAILBOX_IMAP_HOST =
  process.env.NEXT_PUBLIC_MAILBOX_IMAP_HOST?.trim() || "imap.mail.rukny.io";

export const DEVELOPER_SMTP_HOST =
  process.env.NEXT_PUBLIC_DEVELOPER_SMTP_HOST?.trim() || "smtp.rukny.io";

export const DEVELOPER_SMTP_USERNAME =
  process.env.NEXT_PUBLIC_DEVELOPER_SMTP_USERNAME?.trim() || "rukny";
