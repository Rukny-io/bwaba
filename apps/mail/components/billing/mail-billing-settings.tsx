"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Chip,
  Skeleton,
} from "@heroui/react";
import { formatMailAliasLimit, formatMailIqD } from "@/lib/mail-plans";
import {
  fetchMailSubscription,
  type MailPendingPlanRequest,
  type MailSubscriptionView,
} from "@/lib/mail-subscription-client";

const FEATURE_LABELS: Array<{
  key: keyof NonNullable<MailSubscriptionView["features"]>;
  label: string;
}> = [
  { key: "agenticMail", label: "AI email assistant" },
  { key: "aiToolsUnlimited", label: "Unlimited AI tools" },
  { key: "openTracking", label: "Open tracking" },
  { key: "smartAiReplies", label: "Smart AI replies" },
  { key: "automaticReplies", label: "Automatic replies" },
  { key: "linkAndFileTracking", label: "Link and file tracking" },
  { key: "premiumDelivery", label: "Premium email delivery" },
];

export function MailPlanSettingsSection() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<MailSubscriptionView | null>(null);
  const [pendingRequest, setPendingRequest] = useState<MailPendingPlanRequest | null>(
    null,
  );
  const [appName, setAppName] = useState<string | null>(null);
  const [needsApp, setNeedsApp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const current = await fetchMailSubscription();
        if (cancelled) return;
        setNeedsApp(current.needsApp);
        setAppName(current.app?.name ?? null);
        setSubscription(current.subscription);
        setPendingRequest(current.pendingRequest);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load subscription.");
          setSubscription(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const active = subscription?.status === "ACTIVE" ? subscription : null;

  return (
    <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Plan</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {appName
              ? `Seats and storage apply only to ${appName}.`
              : "Seats and storage apply only to the Mail app you have open."}{" "}
            Card payment is coming soon.
          </p>
        </div>
        {loading ? null : (
          <Chip
            color={active ? "success" : pendingRequest ? "warning" : "default"}
            size="sm"
            variant="soft"
          >
            {active ? active.planName : pendingRequest ? "Pending" : "No plan"}
          </Chip>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 rounded-lg" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Plan</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : needsApp ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Open a Mail app to see its subscription.
        </p>
      ) : active ? (
        <>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--muted-foreground)]">Monthly total</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {formatMailIqD(active.monthlyTotal)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Mailbox seats</dt>
              <dd className="font-medium text-[var(--foreground)]">{active.mailboxCount}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Renews</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {active.renewsAt
                  ? new Date(active.renewsAt).toLocaleDateString("en-GB")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Storage</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {active.limits.storageGbPerMailbox} GB for emails
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Forwarding</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {active.limits.forwardingRules} rules
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Aliases / mailbox</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {formatMailAliasLimit(active.limits.emailAliases)}
              </dd>
            </div>
          </dl>
          <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
            {FEATURE_LABELS.map((feature) => (
              <li key={feature.key} className="text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--foreground)]">
                  {active.features?.[feature.key] ? "On" : "Off"}
                </span>
                {" · "}
                {feature.label}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">
          No active plan on this app. Request Starter, Standard, or Premium from Pricing
          so an admin can activate seats, storage, and features.
        </p>
      )}

      {pendingRequest ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Request pending · ticket {pendingRequest.ticketNumber}
          {pendingRequest.plan ? ` · ${pendingRequest.plan}` : ""} ·{" "}
          {pendingRequest.mailboxCount} seats.
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button size="sm" onPress={() => router.push("/pricing")}>
          {active ? "Change plan" : "Request a plan"}
        </Button>
      </div>
    </div>
  );
}
