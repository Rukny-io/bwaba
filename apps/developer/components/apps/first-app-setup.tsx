'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  TextField,
  Label,
  Input,
  Button,
  Spinner,
  InputOTP,
} from '@heroui/react';
import {
  Sparkles,
  LogOut,
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  Users,
  Package,
  ShieldCheck,
  Phone,
} from 'lucide-react';
import {
  useCreateApp,
  useSendAppOtp,
  useVerifyAppOtp,
} from '@/hooks/use-apps';
import type { DeveloperAppType } from '@/lib/api/types';
import { appDashboard } from '@/lib/app-routes';
import { logoutWithNotification } from '@/lib/auth-notify';
import { useTranslations } from '@/components/providers/translations-provider';
import { AppsLocaleBar } from '@/components/apps/apps-locale-bar';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;

interface WizardData {
  name: string;
  contactEmail: string;
  appType: DeveloperAppType;
  phoneNumber: string;
  otpCode: string;
}

function StepIndicator({
  currentStep,
  labels,
}: {
  currentStep: Step;
  labels: { step1Title: string; step2Title: string; step3Title: string; step4Title: string };
}) {
  const steps = [
    { num: 1 as const, label: labels.step1Title },
    { num: 2 as const, label: labels.step2Title },
    { num: 3 as const, label: labels.step3Title },
    { num: 4 as const, label: labels.step4Title },
  ];

  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2">
          <div
            className={cn(
              'flex size-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300',
              step.num < currentStep
                ? 'bg-[var(--success)] text-[var(--success-foreground)]'
                : step.num === currentStep
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
            )}
          >
            {step.num < currentStep ? <Check className="size-3.5" /> : step.num}
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'h-px w-6 sm:w-10 transition-colors duration-300',
                step.num < currentStep ? 'bg-[var(--success)]' : 'bg-[var(--border)]',
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Step1AppDetails({
  data,
  onChange,
  labels,
}: {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
  labels: Record<string, string>;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">{labels.step1Title}</h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{labels.step1Desc}</p>
      </div>

      <div className="dashboard-card space-y-4 rounded-2xl p-5">
        <TextField isRequired>
          <Label className="text-xs font-medium text-[var(--foreground)]">{labels.appName}</Label>
          <Input
            placeholder={labels.appNamePlaceholder}
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="rounded-xl"
            autoFocus
          />
        </TextField>
        <p className="-mt-2 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
          {labels.appNameHint}
        </p>

        <TextField isRequired>
          <Label className="text-xs font-medium text-[var(--foreground)]">{labels.contactEmail}</Label>
          <Input
            type="email"
            placeholder={labels.contactEmailPlaceholder}
            value={data.contactEmail}
            onChange={(e) => onChange({ contactEmail: e.target.value })}
            className="rounded-xl"
          />
        </TextField>
        <p className="-mt-2 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
          {labels.contactEmailHint}
        </p>
      </div>
    </div>
  );
}

function Step2UseCases({ labels }: { labels: Record<string, string> }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">{labels.step2Title}</h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{labels.step2Desc}</p>
      </div>

      <div className="rounded-2xl border border-[color-mix(in_srgb,var(--primary)_30%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_6%,var(--background))] p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))]">
            <Package className="size-5 text-[var(--primary)]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">{labels.useCaseOther}</h3>
              <div className="flex size-5 items-center justify-center rounded-full bg-[var(--primary)]">
                <Check className="size-3 text-[var(--primary-foreground)]" />
              </div>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
              {labels.useCaseOtherDesc}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-[var(--surface-secondary)] px-4 py-3">
        <p className="text-center text-xs text-[var(--muted-foreground)]">{labels.moreUseCasesSoon}</p>
      </div>
    </div>
  );
}

function RadioIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        'mt-1 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200',
        selected
          ? 'border-[var(--primary)]'
          : 'border-[color-mix(in_srgb,var(--foreground)_18%,var(--border))] bg-[var(--background)]',
      )}
      aria-hidden
    >
      <span
        className={cn(
          'size-2 rounded-full bg-[var(--primary)] transition-all duration-200',
          selected ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
        )}
      />
    </span>
  );
}

function Step3AppType({
  data,
  onChange,
  labels,
}: {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
  labels: Record<string, string>;
}) {
  const types: {
    value: DeveloperAppType;
    icon: typeof Building2;
    title: string;
    desc: string;
  }[] = [
    {
      value: 'BUSINESS',
      icon: Building2,
      title: labels.typeBusiness,
      desc: labels.typeBusinessDesc,
    },
    {
      value: 'CONSUMER',
      icon: Users,
      title: labels.typeConsumer,
      desc: labels.typeConsumerDesc,
    },
  ];

  function handleKeyDown(event: React.KeyboardEvent, current: DeveloperAppType) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    onChange({
      appType: current === 'BUSINESS' ? 'CONSUMER' : 'BUSINESS',
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">{labels.step3Title}</h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{labels.step3Desc}</p>
      </div>

      <div
        role="radiogroup"
        aria-label={labels.step3Title}
        className="space-y-2.5"
      >
        {types.map((type) => {
          const Icon = type.icon;
          const selected = data.appType === type.value;
          return (
            <button
              key={type.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange({ appType: type.value })}
              onKeyDown={(e) => handleKeyDown(e, type.value)}
              className={cn(
                'group flex w-full items-start gap-3.5 rounded-2xl border p-4 text-start transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
                selected
                  ? 'border-[color-mix(in_srgb,var(--primary)_45%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_7%,var(--background))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_12%,transparent)]'
                  : 'border-[var(--border)] bg-[var(--background)] hover:border-[color-mix(in_srgb,var(--primary)_22%,var(--border))] hover:bg-[var(--surface-secondary)]',
              )}
            >
              <RadioIndicator selected={selected} />

              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200',
                    selected
                      ? 'bg-[color-mix(in_srgb,var(--primary)_14%,var(--background))]'
                      : 'bg-[var(--surface-secondary)] group-hover:bg-[color-mix(in_srgb,var(--primary)_8%,var(--surface-secondary))]',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-5 transition-colors duration-200',
                      selected ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]',
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <h3
                    className={cn(
                      'text-sm font-semibold transition-colors duration-200',
                      selected ? 'text-[var(--primary)]' : 'text-[var(--foreground)]',
                    )}
                  >
                    {type.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
                    {type.desc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-[var(--muted-foreground)]">{labels.typeCannotChange}</p>
    </div>
  );
}

function Step4Verification({
  data,
  onChange,
  labels,
  onSendOtp,
  onVerifyOtp,
  isSending,
  isVerifying,
  otpSent,
  otpVerified,
  otpError,
  cooldown,
}: {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
  labels: Record<string, string>;
  onSendOtp: () => void;
  onVerifyOtp: (code?: string) => void;
  isSending: boolean;
  isVerifying: boolean;
  otpSent: boolean;
  otpVerified: boolean;
  otpError: string;
  cooldown: number;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">{labels.step4Title}</h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{labels.step4Desc}</p>
      </div>

      <div className="dashboard-card space-y-4 rounded-2xl p-5">
        <TextField isRequired>
          <Label className="text-xs font-medium text-[var(--foreground)]">{labels.phoneLabel}</Label>
          <Input
            type="tel"
            placeholder={labels.phonePlaceholder}
            value={data.phoneNumber}
            onChange={(e) => onChange({ phoneNumber: e.target.value.replace(/\D/g, '') })}
            className="rounded-xl"
            dir="ltr"
            disabled={otpVerified}
          />
        </TextField>
        <p className="-mt-2 text-[11px] leading-relaxed text-[var(--muted-foreground)]">{labels.phoneHint}</p>

        {!otpSent && !otpVerified ? (
          <Button
            type="button"
            className="h-10 w-full rounded-xl bg-[var(--primary)] font-medium text-[var(--primary-foreground)]"
            isDisabled={!data.phoneNumber || data.phoneNumber.length < 10 || isSending}
            onPress={onSendOtp}
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                {labels.sending}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Phone className="size-4" />
                {labels.sendOtp}
              </span>
            )}
          </Button>
        ) : null}

        {otpSent && !otpVerified ? (
          <div className="space-y-4 pt-2">
            <div className="h-px bg-[var(--border)]" />

            <p className="text-center text-xs font-medium text-[var(--foreground)]">
              {labels.otpSentTo}{' '}
              <span dir="ltr" className="font-mono">
                {data.phoneNumber}
              </span>
            </p>

            <div className="flex justify-center" dir="ltr">
              <InputOTP
                maxLength={6}
                value={data.otpCode}
                onChange={(val: string) => onChange({ otpCode: val })}
                onComplete={(code) => {
                  onChange({ otpCode: code });
                  onVerifyOtp(code);
                }}
              >
                <InputOTP.Group>
                  <InputOTP.Slot index={0} />
                  <InputOTP.Slot index={1} />
                  <InputOTP.Slot index={2} />
                </InputOTP.Group>
                <InputOTP.Separator />
                <InputOTP.Group>
                  <InputOTP.Slot index={3} />
                  <InputOTP.Slot index={4} />
                  <InputOTP.Slot index={5} />
                </InputOTP.Group>
              </InputOTP>
            </div>

            {isVerifying ? (
              <div className="flex justify-center">
                <Spinner size="sm" />
              </div>
            ) : null}

            {otpError ? (
              <p className="text-center text-xs text-[var(--danger)]">{otpError}</p>
            ) : null}

            <button
              type="button"
              onClick={onSendOtp}
              disabled={cooldown > 0 || isSending}
              className="w-full text-center text-xs text-[var(--primary)] hover:underline disabled:text-[var(--muted-foreground)] disabled:no-underline"
            >
              {cooldown > 0
                ? labels.resendCooldown.replace('{seconds}', String(cooldown))
                : labels.resend}
            </button>
          </div>
        ) : null}

        {otpVerified ? (
          <div className="flex items-center justify-center gap-2 py-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--success)_15%,var(--background))]">
              <ShieldCheck className="size-4 text-[var(--success)]" />
            </div>
            <p className="text-sm font-medium text-[var(--success)]">{labels.verified}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function FirstAppSetup({ defaultEmail = '' }: { defaultEmail?: string }) {
  const router = useRouter();
  const t = useTranslations();
  const a = t.apps;
  const isRtl = t.common.switchLang === 'English';
  const dir = isRtl ? 'rtl' : 'ltr';

  const createApp = useCreateApp();
  const sendOtp = useSendAppOtp();
  const verifyOtp = useVerifyAppOtp();

  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<WizardData>({
    name: '',
    contactEmail: defaultEmail,
    appType: 'BUSINESS',
    phoneNumber: '',
    otpCode: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [createError, setCreateError] = useState('');

  const updateData = useCallback(
    (partial: Partial<WizardData>) => setData((prev) => ({ ...prev, ...partial })),
    [],
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const isStep1Valid =
    data.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail);
  const isStep2Valid = true;
  const isStep3Valid = Boolean(data.appType);
  const isStep4Valid = otpVerified;

  const canProceed = [isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid][step - 1];

  const handleNext = () => {
    if (step < 4) setStep((s) => (s + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handleSendOtp = async () => {
    setOtpError('');
    try {
      await sendOtp.mutateAsync({ phoneNumber: data.phoneNumber });
      setOtpSent(true);
      setCooldown(60);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : a.toastOtpSendFailed);
    }
  };

  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = (codeOverride ?? data.otpCode).trim();
    if (code.length < 6) return;

    setOtpError('');
    try {
      await verifyOtp.mutateAsync({
        phoneNumber: data.phoneNumber,
        code,
      });
      updateData({ otpCode: code });
      setOtpVerified(true);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : a.toastOtpInvalid);
    }
  };

  const handleCreate = async () => {
    setCreateError('');
    try {
      const app = await createApp.mutateAsync({
        name: data.name.trim(),
        contactEmail: data.contactEmail.trim(),
        appType: data.appType,
        otpCode: data.otpCode,
      });
      router.replace(appDashboard(app.appId));
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : a.toastCreateFailed);
    }
  };

  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  const NextArrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="flex min-h-dvh" dir={dir}>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2.5">
              <Image src="/rukny-logo.svg" alt="Rukny" width={32} height={32} priority />
              <span className="text-lg font-bold text-[var(--foreground)]">Rukny</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">{a.welcome}</h1>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{a.welcomeDesc}</p>
            </div>
          </div>

          <StepIndicator
            currentStep={step}
            labels={{
              step1Title: a.step1Title,
              step2Title: a.step2Title,
              step3Title: a.step3Title,
              step4Title: a.step4Title,
            }}
          />

          <div className="min-h-[280px]">
            {step === 1 ? (
              <Step1AppDetails data={data} onChange={updateData} labels={a as Record<string, string>} />
            ) : null}
            {step === 2 ? <Step2UseCases labels={a as Record<string, string>} /> : null}
            {step === 3 ? (
              <Step3AppType data={data} onChange={updateData} labels={a as Record<string, string>} />
            ) : null}
            {step === 4 ? (
              <Step4Verification
                data={data}
                onChange={updateData}
                labels={a as Record<string, string>}
                onSendOtp={() => void handleSendOtp()}
                onVerifyOtp={() => void handleVerifyOtp()}
                isSending={sendOtp.isPending}
                isVerifying={verifyOtp.isPending}
                otpSent={otpSent}
                otpVerified={otpVerified}
                otpError={otpError}
                cooldown={cooldown}
              />
            ) : null}
          </div>

          {createError ? (
            <p className="text-center text-xs text-[var(--danger)]">{createError}</p>
          ) : null}

          <div className="flex items-center gap-3">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 rounded-xl font-medium"
                onPress={handleBack}
              >
                <BackArrow className="size-4" />
                {a.back}
              </Button>
            ) : null}

            {step < 4 ? (
              <Button
                type="button"
                className={cn(
                  'h-11 rounded-xl bg-[var(--primary)] font-medium text-[var(--primary-foreground)]',
                  step === 1 ? 'w-full' : 'flex-1',
                )}
                isDisabled={!canProceed}
                onPress={handleNext}
              >
                {a.next}
                <NextArrow className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="h-11 flex-1 rounded-xl bg-[var(--primary)] font-medium text-[var(--primary-foreground)]"
                isDisabled={!otpVerified || createApp.isPending}
                onPress={() => void handleCreate()}
              >
                {createApp.isPending ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    {a.creating}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="size-4" />
                    {a.create}
                  </span>
                )}
              </Button>
            )}
          </div>

          <div className="flex flex-col items-center gap-3">
            <Link
              href="/apps"
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              {a.backToApps}
            </Link>
            <button
              type="button"
              onClick={() => void logoutWithNotification()}
              className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              <LogOut className="size-3" />
              {t.sidebar.logout}
            </button>
            <AppsLocaleBar />
          </div>
        </div>
      </div>
    </div>
  );
}
