"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Spinner,
  TextField,
  cn,
} from "@heroui/react";
import { ArrowLeft, ArrowRight, Check, Globe, ShieldCheck } from "lucide-react";
import { DnsRecordsTable } from "@/components/app/dns-records-table";
import { applyDnsCheckResults, normalizeDomain, validateDomain, type MailDomainSetup } from "@/lib/mail-domain";
import {
  readMailDomainSetup,
  setMailWizardDismissed,
  writeMailDomainSetup,
} from "@/lib/mail-domain-storage";
import { createDomainRequest, verifyDomainRequest } from "@/lib/verify-domain-client";

type Step = 1 | 2 | 3;

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps = [
    { num: 1 as const, label: "Domain" },
    { num: 2 as const, label: "DNS" },
    { num: 3 as const, label: "Verify" },
  ];

  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300",
              step.num < currentStep
                ? "bg-[var(--success)] text-[var(--success-foreground)]"
                : step.num === currentStep
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--surface-secondary)] text-[var(--muted-foreground)]",
            )}
          >
            {step.num < currentStep ? <Check className="size-3.5" /> : step.num}
          </div>
          <span className="hidden text-[11px] font-medium text-[var(--muted-foreground)] sm:inline">
            {step.label}
          </span>
          {i < steps.length - 1 ? (
            <div
              className={cn(
                "h-px w-6 sm:w-10",
                step.num < currentStep ? "bg-[var(--success)]" : "bg-[var(--border)]",
              )}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function MailSetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [domainInput, setDomainInput] = useState("");
  const [setup, setSetup] = useState<MailDomainSetup | null>(null);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const existing = readMailDomainSetup();
    // Only resume in-progress setup for THIS app — never ACTIVE (that's the dashboard).
    if (!existing || existing.status === "ACTIVE") return;
    setSetup(existing);
    setDomainInput(existing.domain);
    setStep(existing.status === "FAILED" ? 3 : 2);
  }, []);

  const normalized = useMemo(() => normalizeDomain(domainInput), [domainInput]);
  const domainError = domainInput.trim() ? validateDomain(normalized) : null;

  function persist(next: MailDomainSetup) {
    setSetup(next);
    writeMailDomainSetup(next);
  }

  async function handleCreateDomain() {
    const message = validateDomain(normalized);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setCreating(true);
    try {
      persist(await createDomainRequest(normalized));
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this domain.");
    } finally {
      setCreating(false);
    }
  }

  async function handleVerify() {
    if (!setup) return;
    setError("");
    setVerifying(true);
    persist({
      ...setup,
      status: "VERIFYING",
      records: setup.records.map((record) => ({ ...record, status: "checking" })),
    });

    try {
      const result = await verifyDomainRequest(setup.domain, setup.dkimTokens ?? []);
      const next = applyDnsCheckResults(setup, result.results, result.verified, result.waiting);
      persist(next);
      if (result.verified) {
        setMailWizardDismissed(false);
        router.refresh();
        router.replace("/app");
        return;
      }
      setError(
        result.waiting
          ? "DNS is live. Sending confirmation is still pending."
          : "Some records are missing or still propagating. Wait a few minutes, then check again.",
      );
    } catch (err) {
      persist({
        ...setup,
        status: "FAILED",
        records: setup.records.map((record) => ({ ...record, status: "failed" })),
      });
      setError(err instanceof Error ? err.message : "Could not check DNS.");
    } finally {
      setVerifying(false);
    }
  }

  function handleSkipToDashboard() {
    if (!setup) return;
    // Keep domain + DNS records; verification can finish later from Domain settings.
    persist({
      ...setup,
      status: setup.status === "ACTIVE" ? "ACTIVE" : "PENDING_DNS",
    });
    setMailWizardDismissed(true);
    router.refresh();
    window.location.assign("/app");
  }

  return (
    <div className="flex min-h-dvh bg-[var(--background)]">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-xl space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2.5">
              <Image src="/rukny-logo.svg" alt="Rukny" width={32} height={32} priority />
              <span className="text-lg font-bold text-[var(--foreground)]">Rukny Mail</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">Connect your domain</h1>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Add the DNS records at your registrar, then we will check that they are live.
              </p>
            </div>
          </div>

          <StepIndicator currentStep={step} />

          {step === 1 ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[var(--background)] p-5">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))]">
                    <Globe className="size-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--foreground)]">Your domain</h2>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
                      Use a domain you already own. Mailboxes such as support@{normalized || "example.com"} will
                      be created after DNS is verified.
                    </p>
                  </div>
                </div>
                <TextField isRequired>
                  <Label className="text-xs font-medium text-[var(--foreground)]">Domain</Label>
                  <Input
                    placeholder="example.com"
                    value={domainInput}
                    onChange={(event) => {
                      setDomainInput(event.target.value);
                      setError("");
                    }}
                    className="rounded-xl"
                    autoFocus
                  />
                </TextField>
                {domainError ? (
                  <p className="mt-2 text-xs text-[var(--danger)]">{domainError}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 2 && setup ? (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Add these DNS records</h2>
              <DnsRecordsTable domain={setup.domain} records={setup.records} />
            </div>
          ) : null}

          {step === 3 && setup ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">Check DNS</h2>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  We look up MX, CNAME, and TXT for this domain.
                </p>
              </div>
              <DnsRecordsTable domain={setup.domain} records={setup.records} showStatus />
            </div>
          ) : null}

          {error ? <p className="text-center text-xs text-[var(--danger)]">{error}</p> : null}

          <div className="flex items-center gap-3">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 rounded-xl font-medium"
                onPress={() => {
                  setError("");
                  setStep((current) => (current - 1) as Step);
                }}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
            ) : null}

            {step === 1 ? (
              <Button
                type="button"
                className="h-11 w-full rounded-xl bg-[var(--primary)] font-medium text-[var(--primary-foreground)]"
                isDisabled={Boolean(domainError) || !domainInput.trim() || creating}
                onPress={() => void handleCreateDomain()}
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Adding domain
                  </span>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            ) : null}

            {step === 2 ? (
              <Button
                type="button"
                className="h-11 flex-1 rounded-xl bg-[var(--primary)] font-medium text-[var(--primary-foreground)]"
                onPress={() => setStep(3)}
              >
                I added the records
                <ArrowRight className="size-4" />
              </Button>
            ) : null}

            {step === 3 ? (
              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-xl font-medium"
                  isDisabled={verifying || !setup}
                  onPress={handleSkipToDashboard}
                >
                  Skip
                </Button>
                <Button
                  type="button"
                  className="h-11 flex-1 rounded-xl bg-[var(--primary)] font-medium text-[var(--primary-foreground)]"
                  isDisabled={verifying}
                  onPress={() => void handleVerify()}
                >
                  {verifying ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" />
                      Checking DNS
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="size-4" />
                      Check DNS
                    </span>
                  )}
                </Button>
              </div>
            ) : null}
          </div>

          {step === 3 ? (
            <p className="text-center text-[11px] leading-relaxed text-[var(--muted-foreground)]">
              Verification can take minutes to hours depending on your DNS provider. You can skip
              and verify later from Domain settings.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
