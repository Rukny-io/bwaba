"use client";

import { format } from "date-fns";
import type { Locale } from "date-fns";
import { cn } from "@/lib/utils";
import type { SupportTicketAttachment, SupportTicketMessage } from "@/lib/manage/types";
import { SupportAttachmentsList } from "./support-attachments-list";
import { SupportChatAvatar } from "./support-chat-avatar";

export function SupportChatBubble({
  message,
  isOwn,
  senderLabel,
  dateLocale,
  userAvatar,
  userInitials,
}: {
  message: SupportTicketMessage;
  isOwn: boolean;
  senderLabel: string;
  dateLocale: Locale;
  userAvatar?: string | null;
  userInitials: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full max-w-[92%] gap-2.5",
        isOwn ? "ms-auto flex-row-reverse" : "me-auto flex-row",
      )}
    >
      <SupportChatAvatar
        variant={message.isStaff ? "staff" : "user"}
        avatar={!message.isStaff ? userAvatar : undefined}
        initials={userInitials}
        alt={senderLabel}
      />

      <div
        className={cn(
          "flex min-w-0 max-w-[min(100%,28rem)] flex-col gap-1",
          isOwn ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]",
            isOwn ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="font-medium text-foreground">{senderLabel}</span>
          <time
            className="text-muted-foreground"
            dateTime={message.createdAt}
          >
            {format(new Date(message.createdAt), "PPp", { locale: dateLocale })}
          </time>
        </div>

        <div
          className={cn(
            "w-full rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
            isOwn
              ? "rounded-ee-sm bg-primary text-primary-foreground"
              : "rounded-es-sm border border-border/60 bg-card text-foreground",
            message.isStaff &&
              "border-primary/15 bg-primary/5 text-foreground shadow-none",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
          {message.attachments?.length ? (
            <div className={cn("mt-2", message.isStaff ? "" : "[&_a]:text-primary-foreground")}>
              <SupportAttachmentsList attachments={message.attachments} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SupportTicketAttachmentsBlock({
  attachments,
  title,
}: {
  attachments: SupportTicketAttachment[];
  title: string;
}) {
  if (!attachments.length) return null;

  return (
    <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-3.5 py-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
      <SupportAttachmentsList attachments={attachments} />
    </div>
  );
}
