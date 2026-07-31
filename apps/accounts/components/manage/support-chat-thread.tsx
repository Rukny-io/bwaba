"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "date-fns";
import { cn } from "@/lib/utils";
import type { SupportTicketAttachment, SupportTicketMessage } from "@/lib/manage/types";
import { ManageGroup } from "./manage-ui";
import { SupportChatBubble, SupportTicketAttachmentsBlock } from "./support-chat-bubble";

export function SupportChatThread({
  messages,
  ticketAttachments,
  isLive,
  peerTyping = false,
  dateLocale,
  userAvatar,
  userInitials,
  className,
}: {
  messages: SupportTicketMessage[];
  ticketAttachments?: SupportTicketAttachment[];
  isLive: boolean;
  peerTyping?: boolean;
  dateLocale: Locale;
  userAvatar?: string | null;
  userInitials: string;
  className?: string;
}) {
  const t = useTranslations("Manage");
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);

  useEffect(() => {
    if (messages.length >= prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    prevCountRef.current = messages.length;
  }, [messages.length, messages[messages.length - 1]?.id]);

  return (
    <ManageGroup className={cn("flex flex-col overflow-hidden p-0", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
        <p className="text-sm font-medium text-foreground">
          {t("support.conversation_title")}
        </p>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            {t("support.live_connected")}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            {t("support.live_connecting")}
          </span>
        )}
      </div>

      <div className="flex max-h-[min(58vh,520px)] flex-col gap-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("support.conversation_empty")}
          </p>
        ) : (
          messages.map((message) => (
            <SupportChatBubble
              key={message.id}
              message={message}
              isOwn={!message.isStaff}
              senderLabel={
                message.isStaff
                  ? t("support.staff_reply")
                  : t("support.your_reply")
              }
              dateLocale={dateLocale}
              userAvatar={userAvatar}
              userInitials={userInitials}
            />
          ))
        )}

        {peerTyping ? (
          <div className="me-auto flex max-w-[92%] items-center gap-2 px-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-3 py-1.5 text-[11px] text-muted-foreground">
              <span className="flex gap-0.5">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:0ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:150ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:300ms]" />
              </span>
              {t("support.typing_staff")}
            </span>
          </div>
        ) : null}

        {ticketAttachments?.length ? (
          <SupportTicketAttachmentsBlock
            attachments={ticketAttachments}
            title={t("support.ticket_attachments")}
          />
        ) : null}

        <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
      </div>
    </ManageGroup>
  );
}
