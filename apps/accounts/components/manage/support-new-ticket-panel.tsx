"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ListBox, Select } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createSupportTicket } from "@/lib/manage/api";
import type { SupportTicketCategory } from "@/lib/manage/types";
import { useManage } from "@/lib/manage/context";
import {
  ManageFormBody,
  ManageFormField,
  ManageFormFooter,
  ManageGroup,
  ManageNotice,
  ManagePageHeader,
  ManagePageStack,
  ManageSuccessBanner,
} from "./manage-ui";
import {
  SupportAttachmentInput,
  uploadSupportAttachments,
} from "./support-attachment-input";

const CATEGORIES: SupportTicketCategory[] = [
  "ACCOUNT",
  "BILLING",
  "TECHNICAL",
  "FEATURE_REQUEST",
  "OTHER",
];

export function SupportNewTicketPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Manage");
  const locale = useLocale();
  const { summary } = useManage();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SupportTicketCategory>("TECHNICAL");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdNumber, setCreatedNumber] = useState<string | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  const canSubmit =
    subject.trim().length >= 3 && description.trim().length >= 10 && !busy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);
    try {
      const ticket = await createSupportTicket({
        subject: subject.trim(),
        description: description.trim(),
        category,
        context: {
          page: pathname,
          locale,
          plan: summary?.plan,
          twoFactorEnabled: summary?.twoFactorEnabled,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        },
      });
      if (attachmentFiles.length > 0) {
        await uploadSupportAttachments(ticket.id, attachmentFiles);
      }
      setCreatedNumber(ticket.number);
    } catch (err) {
      const message =
        (err as Error & { data?: { message?: string } }).data?.message ||
        t("support.create_error");
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  if (createdNumber) {
    return (
      <ManagePageStack>
        <ManageSuccessBanner>
          {t("support.create_success", { number: createdNumber })}
        </ManageSuccessBanner>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => router.push("/manage/support/tickets")}>
            {t("support.view_tickets")}
          </Button>
          <Button variant="outline" onClick={() => router.push("/manage/support")}>
            {t("support.back_to_hub")}
          </Button>
        </div>
      </ManagePageStack>
    );
  }

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("support.new_ticket")}
        titleShort={t("support.new_ticket_short")}
        description={t("support.new_ticket_page_desc")}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <ManageGroup className="manage-form">
          <ManageFormBody>
            <ManageFormField label={t("support.field_category")} htmlFor="ticket-category">
              <Select
                id="ticket-category"
                selectedKey={category}
                onSelectionChange={(key) => {
                  if (key) setCategory(String(key) as SupportTicketCategory);
                }}
                className="w-full"
                aria-label={t("support.field_category")}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {CATEGORIES.map((item) => (
                      <ListBox.Item
                        key={item}
                        id={item}
                        textValue={t(`support.category.${item}`)}
                      >
                        {t(`support.category.${item}`)}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </ManageFormField>

            <ManageFormField label={t("support.field_subject")} htmlFor="ticket-subject">
              <Input
                id="ticket-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                placeholder={t("support.field_subject_placeholder")}
                required
              />
            </ManageFormField>

            <ManageFormField label={t("support.field_description")} htmlFor="ticket-description">
              <Textarea
                id="ticket-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={5000}
                rows={6}
                placeholder={t("support.field_description_placeholder")}
                className="min-h-[140px]"
                required
              />
            </ManageFormField>

            <SupportAttachmentInput
              files={attachmentFiles}
              onChange={setAttachmentFiles}
              disabled={busy}
            />

            <ManageNotice>{t("support.context_note")}</ManageNotice>
          </ManageFormBody>

          <ManageFormFooter>
            <Button type="submit" disabled={!canSubmit} className="min-w-[140px]">
              {busy ? t("support.submitting") : t("support.submit")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/manage/support")}
            >
              {t("cancel")}
            </Button>
          </ManageFormFooter>
        </ManageGroup>
      </form>
    </ManagePageStack>
  );
}
