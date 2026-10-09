'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  KeyRound,
  Link2,
  MessageSquare,
  WalletCards,
  Webhook,
} from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { useApiKeys } from '@/hooks/use-api-keys';
import { useAppWallet } from '@/hooks/use-wallet';
import { useWhatsappAccounts, useWhatsappTemplates } from '@/hooks/use-whatsapp';
import { appApiKeysNew, appWallet, appWhatsapp } from '@/lib/app-routes';
import { appWhatsappHref } from '@/lib/whatsapp-routes';
import { appWhatsappPhoneHref } from '@/lib/whatsapp-phone-routes';
import { waApiPanel } from './whatsapp-api-shared';

type SetupState = 'done' | 'action';

export function WhatsappApiSetupPanel() {
  const t = useTranslations();
  const rtl = t.common.switchLang === 'English';
  const { app } = useCurrentApp();
  const { data: accounts, isLoading: accountsLoading } = useWhatsappAccounts(app.appId);
  const { data: keys, isLoading: keysLoading } = useApiKeys(app.id);
  const { data: wallet, isLoading: walletLoading } = useAppWallet(app.appId);
  const activeAccount = accounts?.find((account) => account.status === 'ACTIVE');
  const phones = activeAccount?.phoneNumbers ?? [];
  const activePhone = phones.find((phone) =>
    ['ACTIVE', 'CONNECTED'].includes(phone.status),
  );
  const { data: templates, isLoading: templatesLoading } = useWhatsappTemplates(
    app.appId,
    activeAccount?.id,
  );
  const approvedTemplates = templates?.filter(
    (template) => template.status.toUpperCase() === 'APPROVED',
  ).length ?? 0;
  const liveKey = keys?.some((key) => key.status === 'ACTIVE');

  const loading = accountsLoading || keysLoading || walletLoading || templatesLoading;
  const steps = [
    {
      icon: Link2,
      title: rtl ? 'اربط WhatsApp Business' : 'Connect WhatsApp Business',
      detail: activeAccount
        ? `${rtl ? 'WABA متصل' : 'WABA connected'}${activeAccount.wabaId ? ` · ${activeAccount.wabaId}` : ''}`
        : rtl
          ? 'أكمل Meta Embedded Signup واربط WABA ورقم هاتف.'
          : 'Complete Meta Embedded Signup and connect a WABA and phone.',
      state: activeAccount ? 'done' : 'action' as SetupState,
      href: appWhatsapp(app.appId),
      action: rtl ? 'فتح WhatsApp Business' : 'Open WhatsApp Business',
    },
    {
      icon: MessageSquare,
      title: rtl ? 'فعّل رقم الهاتف' : 'Activate a phone number',
      detail: activePhone
        ? `${rtl ? 'رقم فعّال' : 'Active number'} · ${activePhone.displayPhoneNumber || activePhone.phoneNumber}`
        : rtl
          ? 'سجّل الرقم وأكمل PIN قبل الإرسال.'
          : 'Register the number and finish the PIN before sending.',
      state: activePhone ? 'done' : 'action' as SetupState,
      href: activePhone
        ? appWhatsappPhoneHref(app.appId, activePhone.phoneId)
        : appWhatsappHref(app.appId, 'phones'),
      action: rtl ? 'إدارة الأرقام' : 'Manage numbers',
    },
    {
      icon: KeyRound,
      title: rtl ? 'أنشئ مفتاح live' : 'Create a live API key',
      detail: liveKey
        ? (rtl ? 'يوجد مفتاح API فعّال.' : 'An active API key is ready.')
        : (rtl ? 'أنشئ rk_live_ واحفظه على خادمك فقط.' : 'Create rk_live_ and store it on your server only.'),
      state: liveKey ? 'done' : 'action' as SetupState,
      href: appApiKeysNew(app.appId),
      action: rtl ? 'إنشاء مفتاح' : 'Create key',
    },
    {
      icon: WalletCards,
      title: rtl ? 'موّل محفظة التطبيق' : 'Fund the app wallet',
      detail: wallet
        ? `${rtl ? 'الرصيد الحالي' : 'Current balance'}: ${wallet.balance.toLocaleString()} ${wallet.currency}`
        : (rtl ? 'يجب توفر رصيد قبل الإرسال.' : 'A balance is required before sending.'),
      state: wallet && wallet.balance > 0 ? 'done' : 'action' as SetupState,
      href: appWallet(app.appId),
      action: rtl ? 'فتح المحفظة' : 'Open wallet',
    },
    {
      icon: Webhook,
      title: rtl ? 'جهّز القوالب والـ Webhook' : 'Prepare templates and webhooks',
      detail: approvedTemplates > 0
        ? `${approvedTemplates} ${rtl ? 'قالب معتمد' : 'approved template(s)'}`
        : (rtl ? 'القوالب المعتمدة مطلوبة خارج نافذة الرعاية.' : 'Approved templates are required outside the care window.'),
      state: approvedTemplates > 0 ? 'done' : 'action' as SetupState,
      href: approvedTemplates > 0
        ? appWhatsappHref(app.appId, 'webhooks')
        : appWhatsapp(app.appId),
      action: approvedTemplates > 0
        ? (rtl ? 'إعداد Webhook' : 'Configure webhook')
        : (rtl ? 'إدارة القوالب' : 'Manage templates'),
    },
  ] satisfies Array<{
    icon: typeof Link2;
    title: string;
    detail: string;
    state: SetupState;
    href: string;
    action: string;
  }>;

  const completed = steps.filter((step) => step.state === 'done').length;

  return (
    <section className={waApiPanel}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--surface-secondary)]">
              <Link2 className="size-4 text-[var(--foreground)]" aria-hidden />
            </span>
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              {rtl ? 'إعداد WhatsApp API' : 'WhatsApp API setup'}
            </h2>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
            {rtl
              ? 'أكمل الخطوات بالترتيب. لن نسمح بالإرسال حتى يكون الربط والرقم والمفتاح والرصيد جاهزين.'
              : 'Complete these steps in order. Sending stays blocked until the connection, phone, key, and wallet are ready.'}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-[12px] font-medium text-[var(--foreground)]">
          {loading ? '…' : `${completed}/${steps.length}`}
        </span>
      </div>

      <div className="mt-5 grid gap-2.5 lg:grid-cols-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const done = step.state === 'done';
          return (
            <div
              key={step.title}
              className="flex items-start gap-3 rounded-xl border border-[var(--border)]/70 bg-[var(--surface)] p-3.5"
            >
              <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${done ? 'bg-[color-mix(in_srgb,var(--success)_13%,var(--surface))]' : 'bg-[var(--surface-secondary)]'}`}>
                {done ? (
                  <CheckCircle2 className="size-4 text-[var(--success)]" aria-hidden />
                ) : (
                  <Icon className="size-4 text-[var(--muted-foreground)]" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[var(--muted-foreground)]">{index + 1}</span>
                  <h3 className="text-[13px] font-semibold text-[var(--foreground)]">{step.title}</h3>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted-foreground)]">{step.detail}</p>
                {!done && (
                  <Link href={step.href} className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--foreground)] underline-offset-2 hover:underline">
                    {step.action}
                    <ArrowRight className="size-3" aria-hidden />
                  </Link>
                )}
              </div>
              {!done && <CircleAlert className="mt-1 size-3.5 shrink-0 text-[var(--warning)]" aria-hidden />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
