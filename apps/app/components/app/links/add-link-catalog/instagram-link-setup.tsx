'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { LinkPlatformIconBadge } from '@/components/app/links/platform-icons/link-platform-icon-badge';
import {
  buildLinkFromType,
  validateLinkForm,
} from '@/lib/links/build-link-from-type';
import { startInstagramOAuth } from '@/lib/links/instagram-oauth';
import type { CreateSocialLinkInput } from '@/lib/links/types';
import { cn } from '@/lib/utils';

const INSTAGRAM_ICON = '/icons/instagram.svg';

interface InstagramLinkSetupProps {
  onBack: () => void;
  onSubmit: (payload: CreateSocialLinkInput) => Promise<void>;
}

function InstagramProfileCardPreview() {
  return (
    <article
      className="flex h-full min-h-[10.5rem] flex-col overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)]"
      aria-hidden
    >
      <div className="relative h-14 shrink-0 bg-[#161823]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <p className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tracking-wide text-white/85">
          Instagram
        </p>
      </div>

      <div className="relative flex flex-1 flex-col px-2.5 pb-2.5">
        <div className="-mt-5 flex items-center justify-between gap-1.5">
          <div className="size-10 shrink-0 overflow-hidden rounded-full bg-[var(--surface-secondary)] ring-[2.5px] ring-[var(--surface)]">
            <div className="flex size-full items-center justify-center bg-[var(--surface-secondary)]">
              <div className="size-4 rounded-full bg-[var(--border)]" />
            </div>
          </div>
          <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-[#1d9bf0] px-2 text-[9px] font-bold text-white">
            متابعة
          </span>
        </div>

        <div className="mt-2 space-y-1">
          <div className="h-2.5 w-[4.5rem] rounded bg-[var(--surface-secondary)]" />
          <div className="h-2 w-[3.25rem] rounded bg-[var(--surface-secondary)]/80" />
        </div>

        <div className="mt-2.5 grid grid-cols-3 gap-0.5 text-center text-[8px] leading-tight text-[var(--muted-foreground)]">
          <div>
            <div className="mx-auto mb-0.5 h-2 w-5 rounded bg-[var(--surface-secondary)]" />
            <p>متابَع</p>
          </div>
          <div>
            <div className="mx-auto mb-0.5 h-2 w-5 rounded bg-[var(--surface-secondary)]" />
            <p>متابع</p>
          </div>
          <div>
            <div className="mx-auto mb-0.5 h-2 w-5 rounded bg-[var(--surface-secondary)]" />
            <p>منشور</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function InstagramLinkSetup({ onBack, onSubmit }: InstagramLinkSetupProps) {
  const [mode, setMode] = useState<'connect' | 'manual'>('connect');
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      await startInstagramOAuth('profile_card', { redirect: '/app/links' });
    } catch (err) {
      setConnecting(false);
      setError(err instanceof Error ? err.message : 'تعذر بدء ربط إنستغرام');
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateLinkForm('instagram', { title, value: username });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = buildLinkFromType('instagram', 'instagram', { title, value: username });
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إضافة الرابط');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-start gap-3 p-4 sm:p-5">
        <button
          type="button"
          onClick={onBack}
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-all hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] active:scale-95"
          aria-label="رجوع"
        >
          <ArrowRight className="size-4" />
        </button>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <LinkPlatformIconBadge type="instagram" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-[var(--muted-foreground)]">إضافة رابط</p>
            <h3 className="truncate text-[18px] font-semibold leading-snug text-[var(--foreground)]">
              Instagram
            </h3>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 sm:px-5 sm:pb-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {mode === 'connect' ? (
          <div className="space-y-2.5">
            <p className="text-[11px] font-medium text-[var(--muted-foreground)]">معاينة على صفحتك</p>
            <div className="grid max-w-sm grid-cols-2 gap-2">
              <InstagramProfileCardPreview />
              <div
                className="min-h-[10.5rem] rounded-[1.25rem] border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/35"
                aria-hidden
              />
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">
              بعد الربط تُملأ البطاقة ببيانات حسابك الحقيقية.
            </p>
          </div>
        ) : (
          <form id="instagram-manual-form" onSubmit={handleManualSubmit} className="space-y-3.5">
            <p className="text-[12px] leading-relaxed text-[var(--muted-foreground)]">
              رابط بسيط يفتح حسابك على إنستغرام.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">العنوان</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="حسابي على إنستغرام"
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3.5 text-[13px] text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">اسم المستخدم</label>
              <input
                type="text"
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3.5 text-[13px] text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />
            </div>
          </form>
        )}

        {error ? (
          <p className="mt-3 text-[12px] text-[var(--danger)]" role="alert">{error}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col gap-2 px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
        {mode === 'connect' ? (
          <>
            <button
              type="button"
              disabled={connecting}
              onClick={() => void handleConnect()}
              className={cn(
                'inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl',
                'bg-[#161823] text-[13px] font-semibold text-white',
                'ring-1 ring-black/10 transition-[transform,opacity] active:scale-[0.98] disabled:opacity-60',
                'hover:opacity-95',
              )}
            >
              {connecting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <>
                  <img src={INSTAGRAM_ICON} alt="" className="size-4 shrink-0" draggable={false} />
                  ربط حساب إنستغرام
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('manual');
                setError(null);
              }}
              className="text-[12px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              إدخال اسم مستخدم بدلاً من ذلك
            </button>
          </>
        ) : (
          <>
            <button
              type="submit"
              form="instagram-manual-form"
              disabled={saving}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[var(--primary)] text-[13px] font-semibold text-[var(--primary-foreground)] transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : 'إضافة الرابط'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('connect');
                setError(null);
              }}
              className="text-[12px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              ربط الحساب
            </button>
          </>
        )}
      </div>
    </div>
  );
}
