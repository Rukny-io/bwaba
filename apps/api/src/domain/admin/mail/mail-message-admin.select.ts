/**
 * Explicit MailMessage projection for HQ /admin/mail.
 * Never include bodyText, bodyHtml, snippet, or rawS3Key.
 */
export const MAIL_MESSAGE_ADMIN_SELECT = {
  id: true,
  mailboxId: true,
  direction: true,
  folder: true,
  status: true,
  fromAddress: true,
  toAddresses: true,
  subject: true,
  sesMessageId: true,
  errorMessage: true,
  sentAt: true,
  receivedAt: true,
  createdAt: true,
} as const;

export const MAIL_MESSAGE_ADMIN_LIST_SELECT = {
  ...MAIL_MESSAGE_ADMIN_SELECT,
  mailbox: {
    select: {
      id: true,
      localPart: true,
      domain: true,
      mailApp: {
        select: {
          appId: true,
          name: true,
        },
      },
    },
  },
} as const;
