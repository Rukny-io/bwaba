"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, ExternalLink, ReceiptText, ShieldCheck } from "lucide-react";
import {
  Button,
  Chip,
  Description,
  Input,
  Label,
  Skeleton,
  Switch,
  TextField,
} from "@heroui/react";
import { MailPlanSettingsSection } from "@/components/billing/mail-billing-settings";
import {
  BillingNotice,
  BillingPanel,
  BillingSection,
  formatInvoiceDeliveryMessage,
} from "@/components/billing/billing-ui";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import { getMailApp, updateMailApp } from "@/lib/mail-apps-client";
import { formatMailIqD } from "@/lib/mail-plans";
import {
  readMailBillingPreferences,
  writeMailBillingPreferences,
  type MailBillingPreferences,
} from "@/lib/mail-preferences";
import {
  fetchMailSubscription,
  downloadMailPaymentInvoice,
  downloadMailCurrentPeriodInvoice,
  sendMailPaymentInvoice,
  type MailSubscriptionPaymentView,
} from "@/lib/mail-subscription-client";

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function paymentStatusColor(
  status: string,
): "success" | "warning" | "danger" | "default" {
  const normalized = status.toUpperCase();
  if (
    normalized === "PAID" ||
    normalized === "SUCCEEDED" ||
    normalized === "SUCCESS" ||
    normalized === "COMPLETED"
  ) {
    return "success";
  }
  if (normalized === "PENDING" || normalized === "PROCESSING") return "warning";
  if (normalized === "FAILED" || normalized === "CANCELLED") return "danger";
  return "default";
}

function isCompletedPayment(status: string) {
  const normalized = status.toUpperCase();
  return (
    normalized === "COMPLETED" ||
    normalized === "PAID" ||
    normalized === "SUCCEEDED" ||
    normalized === "SUCCESS"
  );
}

function formatPaymentDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type NoticeState = {
  tone: "success" | "danger";
  title: string;
  description: string;
} | null;

export function MailBillingPage() {
  const [loading, setLoading] = useState(true);
  const [savingContact, setSavingContact] = useState(false);
  const [issuingPaymentId, setIssuingPaymentId] = useState<string | null>(null);
  const [sendingPaymentId, setSendingPaymentId] = useState<string | null>(null);
  const [issuingCurrent, setIssuingCurrent] = useState(false);
  const [canManageBilling, setCanManageBilling] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [savedContact, setSavedContact] = useState("");
  const [payments, setPayments] = useState<MailSubscriptionPaymentView[]>([]);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [prefs, setPrefs] = useState<MailBillingPreferences>(() =>
    readMailBillingPreferences(),
  );

  const refresh = useCallback(async () => {
    const appId = readMailAppIdFromDocument();
    if (!appId) {
      setLoading(false);
      return;
    }
    const [app, snapshot] = await Promise.all([
      getMailApp(appId),
      fetchMailSubscription(appId),
    ]);
    setContactEmail(app.contactEmail || "");
    setSavedContact(app.contactEmail || "");
    setCanManageBilling(Boolean(snapshot.canManageBilling));
    setIsOwner(Boolean(snapshot.isOwner || app.isOwner));
    setHasActiveSubscription(snapshot.subscription?.status === "ACTIVE");
    setPayments(snapshot.subscription?.payments ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setPrefs(readMailBillingPreferences());
        await refresh();
        if (!cancelled) setNotice(null);
      } catch (err) {
        if (!cancelled) {
          setNotice({
            tone: "danger",
            title: "Something went wrong",
            description:
              err instanceof Error ? err.message : "Could not load billing.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const canEditContact = isOwner || canManageBilling;
  const contactDirty =
    canEditContact &&
    contactEmail.trim().toLowerCase() !== savedContact.trim().toLowerCase();
  const canSaveContact =
    canEditContact &&
    !savingContact &&
    contactDirty &&
    looksLikeEmail(contactEmail);

  function patchPrefs(partial: Partial<MailBillingPreferences>) {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      writeMailBillingPreferences(next);
      return next;
    });
  }

  async function onSaveContact() {
    const appId = readMailAppIdFromDocument();
    if (!appId || !canSaveContact) return;
    setSavingContact(true);
    try {
      const updated = await updateMailApp(appId, {
        contactEmail: contactEmail.trim().toLowerCase(),
      });
      setContactEmail(updated.contactEmail || "");
      setSavedContact(updated.contactEmail || "");
      setNotice({
        tone: "success",
        title: "Billing contact saved",
        description: "Receipts and renewal notices will use this address.",
      });
    } catch (err) {
      setNotice({
        tone: "danger",
        title: "Could not save",
        description:
          err instanceof Error ? err.message : "Could not save billing contact.",
      });
    } finally {
      setSavingContact(false);
    }
  }

  async function onIssuePaymentInvoice(paymentId: string) {
    setIssuingPaymentId(paymentId);
    try {
      const result = await downloadMailPaymentInvoice(paymentId);
      const message = formatInvoiceDeliveryMessage({
        invoiceNumber: result.invoiceNumber,
        downloaded: true,
      });
      setNotice({ tone: "success", ...message });
    } catch (err) {
      setNotice({
        tone: "danger",
        title: "Could not issue invoice",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIssuingPaymentId(null);
    }
  }

  async function onSendPaymentInvoice(paymentId: string) {
    setSendingPaymentId(paymentId);
    try {
      const result = await sendMailPaymentInvoice(paymentId);
      const message = formatInvoiceDeliveryMessage({
        invoiceNumber: result.invoiceNumber,
        emailStatus: result.emailStatus,
        whatsappStatus: result.whatsappStatus,
      });
      setNotice({ tone: "success", ...message });
      await refresh();
    } catch (err) {
      setNotice({
        tone: "danger",
        title: "Could not send invoice",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSendingPaymentId(null);
    }
  }

  async function onIssueCurrentInvoice() {
    setIssuingCurrent(true);
    try {
      const result = await downloadMailCurrentPeriodInvoice();
      const message = formatInvoiceDeliveryMessage({
        invoiceNumber: result.invoiceNumber,
        downloaded: true,
      });
      setNotice({ tone: "success", ...message });
    } catch (err) {
      setNotice({
        tone: "danger",
        title: "Could not issue invoice",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIssuingCurrent(false);
    }
  }

  return (
    <section className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-5 sm:gap-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Billing & payments
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
          Manage this workspace plan, invoices, and billing preferences.
        </p>
      </div>

      {notice ? (
        <BillingNotice
          tone={notice.tone}
          title={notice.title}
          description={notice.description}
          onDismiss={() => setNotice(null)}
        />
      ) : null}

      <MailPlanSettingsSection />

      {loading ? (
        <div className="space-y-2 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <BillingSection
            title="Billing contact"
            description="Receipts and renewal notices go to this address for the workspace."
          >
            {!canEditContact ? (
              <BillingNotice
                tone="info"
                title="View only"
                description="Ask the workspace owner or billing contact to change this email."
              />
            ) : null}

            <TextField
              isRequired
              type="email"
              fullWidth
              className="gap-1.5"
              value={contactEmail}
              onChange={(value) => setContactEmail(value.trim())}
              isDisabled={savingContact || !canEditContact}
            >
              <Label className="text-sm font-medium text-[var(--foreground)]">
                Billing email
              </Label>
              <Input
                type="email"
                placeholder="billing@company.com"
                autoComplete="email"
                dir="ltr"
                className="rounded-2xl shadow-none"
              />
              <Description>
                Uses the same official contact email as workspace settings.
              </Description>
            </TextField>

            {canEditContact ? (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="rounded-full shadow-none"
                  isDisabled={!canSaveContact}
                  onPress={() => void onSaveContact()}
                >
                  {savingContact ? "Saving…" : "Save contact"}
                </Button>
              </div>
            ) : null}
          </BillingSection>

          <BillingSection
            title="Payment method"
            description="Cards are entered securely on Rukny Checkout — nothing is stored in Mail."
          >
            <BillingPanel>
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--foreground)]">
                    <CreditCard className="size-4.5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      Hosted checkout
                    </p>
                    <p className="mt-0.5 text-[13px] leading-5 text-[var(--muted-foreground)]">
                      Pay when you change plan or seats. No card vault in this console.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-[var(--surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--muted-foreground)] sm:self-center">
                  <ShieldCheck className="size-3.5" aria-hidden />
                  Secure
                </span>
              </div>
            </BillingPanel>
          </BillingSection>

          <BillingSection
            title="Invoices & payments"
            description="Issue a PDF invoice for completed charges or the current period."
            action={
              hasActiveSubscription ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full shadow-none"
                  isDisabled={issuingCurrent}
                  onPress={() => void onIssueCurrentInvoice()}
                >
                  {issuingCurrent ? "Issuing…" : "Issue current invoice"}
                </Button>
              ) : undefined
            }
          >
            {payments.length === 0 ? (
              <BillingPanel>
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--muted-foreground)]">
                    <ReceiptText className="size-4.5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <p className="text-[13px] leading-5 text-[var(--muted-foreground)]">
                    No payments yet. After a successful checkout you can issue an
                    invoice from this list — or use “Issue current invoice” for an
                    active plan.
                  </p>
                </div>
              </BillingPanel>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-[var(--surface-secondary)]">
                <div className="hidden grid-cols-[1fr_auto] gap-4 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)] sm:grid">
                  <span>Payment</span>
                  <span>Actions</span>
                </div>
                <ul className="divide-y divide-[color-mix(in_srgb,var(--foreground)_6%,transparent)]">
                  {payments.map((payment) => (
                    <li
                      key={payment.id}
                      className="flex min-w-0 flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {formatMailIqD(payment.amount)}
                          {payment.mailboxCount
                            ? ` · ${payment.mailboxCount} seat${payment.mailboxCount === 1 ? "" : "s"}`
                            : ""}
                        </p>
                        <p className="mt-0.5 text-[13px] text-[var(--muted-foreground)]">
                          {formatPaymentDate(payment.paidAt || payment.createdAt)}
                          {payment.paymentId ? ` · ${payment.paymentId}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip
                          color={paymentStatusColor(payment.status)}
                          size="sm"
                          variant="soft"
                        >
                          {payment.status}
                        </Chip>
                        {payment.receiptUrl ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full shadow-none"
                            onPress={() =>
                              window.open(payment.receiptUrl!, "_blank", "noopener")
                            }
                          >
                            Receipt
                            <ExternalLink className="size-3.5" aria-hidden />
                          </Button>
                        ) : null}
                        {isCompletedPayment(payment.status) ? (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="rounded-full shadow-none"
                              isDisabled={issuingPaymentId === payment.id}
                              onPress={() => void onIssuePaymentInvoice(payment.id)}
                            >
                              {issuingPaymentId === payment.id
                                ? "Issuing…"
                                : "Download"}
                            </Button>
                            {canManageBilling || isOwner ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-full shadow-none"
                                isDisabled={sendingPaymentId === payment.id}
                                onPress={() => void onSendPaymentInvoice(payment.id)}
                              >
                                {sendingPaymentId === payment.id
                                  ? "Sending…"
                                  : "Send"}
                              </Button>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </BillingSection>

          <BillingSection
            title="Billing alerts"
            description="Choose which billing notices you want for this browser."
          >
            <div className="divide-y divide-[color-mix(in_srgb,var(--foreground)_6%,transparent)] rounded-2xl bg-[var(--surface-secondary)] px-4">
              <Switch
                isSelected={prefs.billingAlerts}
                className="w-full justify-between py-3.5"
                onChange={(value) => patchPrefs({ billingAlerts: value })}
              >
                <Switch.Content>
                  <Label>Payment status alerts</Label>
                  <Description>Notify when checkout succeeds or fails.</Description>
                </Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch>

              <Switch
                isSelected={prefs.receiptEmails}
                className="w-full justify-between py-3.5"
                onChange={(value) => patchPrefs({ receiptEmails: value })}
              >
                <Switch.Content>
                  <Label>Email receipts</Label>
                  <Description>Prefer receipts to the billing contact email.</Description>
                </Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch>

              <Switch
                isSelected={prefs.renewReminders}
                className="w-full justify-between py-3.5"
                onChange={(value) => patchPrefs({ renewReminders: value })}
              >
                <Switch.Content>
                  <Label>Renewal reminders</Label>
                  <Description>Remind before the current period ends.</Description>
                </Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch>
            </div>
          </BillingSection>
        </>
      )}
    </section>
  );
}
