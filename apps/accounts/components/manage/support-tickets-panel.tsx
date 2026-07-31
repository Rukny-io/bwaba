"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { LifeBuoy, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchSupportTickets } from "@/lib/manage/api";
import type { SupportTicketStatus, SupportTicketSummary } from "@/lib/manage/types";
import {
  ManageEmptyState,
  ManageGroup,
  ManagePageHeader,
  ManagePageStack,
  ManageSpinner,
  ui,
} from "./manage-ui";
import { cn } from "@/lib/utils";

const FILTERS: Array<SupportTicketStatus | "ALL"> = [
  "ALL",
  "OPEN",
  "WAITING_ON_USER",
  "IN_PROGRESS",
  "CLOSED",
];

export function SupportTicketsPanel() {
  const router = useRouter();
  const t = useTranslations("Manage");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const dateLocale = locale === "ar" ? ar : enUS;
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<SupportTicketStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSupportTickets(
        page,
        filter === "ALL" ? undefined : filter,
      );
      setTickets(data.tickets);
      setTotalPages(data.totalPages);
    } catch {
      setError(t("support.tickets_load_error"));
    } finally {
      setLoading(false);
    }
  }, [page, filter, t]);

  useEffect(() => {
    load();
  }, [load]);

  const statusVariant = (status: SupportTicketStatus) => {
    if (status === "WAITING_ON_USER") return "default" as const;
    if (status === "CLOSED" || status === "RESOLVED") return "outline" as const;
    return "secondary" as const;
  };

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("support.tickets")}
        titleShort={t("support.tickets_short")}
        description={t("support.tickets_page_desc")}
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={filter === item ? "default" : "outline"}
            onClick={() => {
              setFilter(item);
              setPage(1);
            }}
          >
            {t(`support.status.${item}`)}
          </Button>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <ManageSpinner />
      ) : tickets.length === 0 ? (
        <ManageEmptyState
          icon={LifeBuoy}
          title={t("support.tickets_empty_title")}
          description={t("support.tickets_empty_desc")}
          action={
            <Button onClick={() => router.push("/manage/support/tickets/new")}>
              {t("support.new_ticket")}
            </Button>
          }
        />
      ) : (
        <ManageGroup>
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => router.push(`/manage/support/tickets/${ticket.id}`)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors",
                ui.divider,
                "hover:bg-muted/40 active:bg-muted/60",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
                  <Badge variant={statusVariant(ticket.status)}>
                    {t(`support.status.${ticket.status}`)}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                  {ticket.number}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(ticket.updatedAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </p>
              </div>
              <Chevron className="size-[18px] shrink-0 text-muted-foreground/45" />
            </button>
          ))}
        </ManageGroup>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t("support.prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("support.next")}
          </Button>
        </div>
      )}
    </ManagePageStack>
  );
}
