"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ar, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  closeSupportTicket,
  fetchSupportTicket,
  reopenSupportTicket,
  replyToSupportTicket,
} from "@/lib/manage/api";
import type {
  SupportTicketDetail,
  SupportTicketMessage,
  SupportTicketStatus,
} from "@/lib/manage/types";
import {
  ManageGroup,
  ManagePageHeader,
  ManagePageStack,
  ManageSpinner,
} from "./manage-ui";
import {
  SupportAttachmentInput,
  uploadSupportAttachments,
} from "./support-attachment-input";
import { SupportChatThread } from "./support-chat-thread";
import { cn } from "@/lib/utils";
import { useSupportTicketLive } from "@/hooks/use-support-ticket-live";
import { useSupportTicketTyping } from "@/hooks/use-support-ticket-typing";
import { useManage } from "@/lib/manage/context";
import type { LiveSupportMessage } from "@/lib/support-tickets-socket";

function toTicketMessage(
  message: SupportTicketMessage | LiveSupportMessage,
): SupportTicketMessage {
  return {
    id: message.id,
    ticketId: message.ticketId,
    authorId: message.authorId,
    body: message.body,
    isStaff: message.isStaff,
    createdAt:
      typeof message.createdAt === "string"
        ? message.createdAt
        : new Date(message.createdAt).toISOString(),
    attachments:
      "attachments" in message
        ? (message as SupportTicketMessage).attachments
        : undefined,
  };
}

function appendTicketMessage(
  ticket: SupportTicketDetail,
  message: SupportTicketMessage | LiveSupportMessage,
): SupportTicketDetail {
  if (ticket.messages.some((item) => item.id === message.id)) {
    return ticket;
  }
  return {
    ...ticket,
    messages: [...ticket.messages, toTicketMessage(message)],
  };
}

function buildInitials(name?: string | null, email?: string): string {
  const fromName = name?.trim();
  if (fromName) {
    const parts = fromName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
    }
    return fromName.slice(0, 2).toUpperCase();
  }
  return (email?.slice(0, 2) ?? "??").toUpperCase();
}

export function SupportTicketDetailPanel({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const t = useTranslations("Manage");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? ar : enUS;
  const { profile, user } = useManage();

  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [reply, setReply] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userInitials = useMemo(
    () => buildInitials(profile?.profile?.name, user.email),
    [profile?.profile?.name, user.email],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSupportTicket(ticketId);
      setTicket(data);
    } catch {
      setError(t("support.ticket_load_error"));
    } finally {
      setLoading(false);
    }
  }, [ticketId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const { isLive } = useSupportTicketLive(ticketId, {
    onMessage: (message) => {
      setTicket((prev) => (prev ? appendTicketMessage(prev, message) : prev));
    },
    onTicketUpdated: (update) => {
      setTicket((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...(update.status
            ? { status: update.status as SupportTicketStatus }
            : {}),
          ...(update.closedAt !== undefined ? { closedAt: update.closedAt } : {}),
        };
      });
    },
  });

  const canReply =
    ticket &&
    ["OPEN", "IN_PROGRESS", "WAITING_ON_USER"].includes(ticket.status);

  const { peerTyping } = useSupportTicketTyping(ticketId, reply, {
    enabled: Boolean(canReply),
    viewerIsStaff: false,
  });

  const canReopen =
    ticket?.status === "CLOSED" &&
    ticket.closedAt &&
    Date.now() - new Date(ticket.closedAt).getTime() < 7 * 24 * 60 * 60 * 1000;

  const handleReply = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const message = await replyToSupportTicket(ticketId, reply.trim());
      if (replyFiles.length > 0) {
        await uploadSupportAttachments(ticketId, replyFiles, message.id);
        await load();
      } else {
        setTicket((prev) => (prev ? appendTicketMessage(prev, message) : prev));
      }
      setReply("");
      setReplyFiles([]);
    } catch (err) {
      const message =
        (err as Error & { data?: { message?: string } }).data?.message ||
        t("support.reply_error");
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleClose = async () => {
    setBusy(true);
    setError(null);
    try {
      await closeSupportTicket(ticketId);
      await load();
    } catch {
      setError(t("support.close_error"));
    } finally {
      setBusy(false);
    }
  };

  const handleReopen = async () => {
    setBusy(true);
    setError(null);
    try {
      await reopenSupportTicket(ticketId);
      await load();
    } catch (err) {
      const message =
        (err as Error & { data?: { message?: string } }).data?.message ||
        t("support.reopen_error");
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const statusVariant = (status: SupportTicketStatus) => {
    if (status === "WAITING_ON_USER") return "default" as const;
    if (status === "CLOSED" || status === "RESOLVED") return "outline" as const;
    return "secondary" as const;
  };

  if (loading) return <ManageSpinner />;
  if (!ticket) {
    return (
      <ManagePageStack>
        <Alert variant="destructive">
          <AlertDescription>{error || t("support.ticket_load_error")}</AlertDescription>
        </Alert>
      </ManagePageStack>
    );
  }

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={ticket.subject}
        description={ticket.number}
      />

      <div className="flex flex-wrap items-center gap-2 px-0.5">
        <Badge variant={statusVariant(ticket.status)}>
          {t(`support.status.${ticket.status}`)}
        </Badge>
        <Badge variant="outline">{t(`support.category.${ticket.category}`)}</Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <SupportChatThread
        messages={ticket.messages}
        ticketAttachments={ticket.attachments}
        isLive={isLive}
        peerTyping={peerTyping}
        dateLocale={dateLocale}
        userAvatar={profile?.profile?.avatar}
        userInitials={userInitials}
      />

      {canReply && (
        <ManageGroup className="space-y-3 p-4">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={5000}
            rows={3}
            placeholder={t("support.reply_placeholder")}
            className="min-h-[88px] resize-none rounded-xl"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void handleReply();
              }
            }}
          />
          <SupportAttachmentInput
            files={replyFiles}
            onChange={setReplyFiles}
            disabled={busy}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleReply} disabled={busy || !reply.trim()}>
              {busy ? t("support.sending") : t("support.send_reply")}
            </Button>
            <Button variant="outline" onClick={handleClose} disabled={busy}>
              {t("support.close_ticket")}
            </Button>
          </div>
        </ManageGroup>
      )}

      {ticket.status === "CLOSED" && canReopen && (
        <Button variant="outline" className="w-fit" onClick={handleReopen} disabled={busy}>
          {t("support.reopen_ticket")}
        </Button>
      )}

      {ticket.status === "CLOSED" && !canReopen && (
        <p className="text-sm text-muted-foreground">{t("support.closed_note")}</p>
      )}

      <Button variant="ghost" className="w-fit" onClick={() => router.push("/manage/support/tickets")}>
        {t("support.back_to_tickets")}
      </Button>
    </ManagePageStack>
  );
}
