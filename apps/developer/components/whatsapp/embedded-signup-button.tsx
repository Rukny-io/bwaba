'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Loader2, Link2, Plus } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { useEmbeddedSignupConfig, useWhatsappMutations } from '@/hooks/use-whatsapp';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

export type EmbeddedSignupMode = 'connect' | 'add-phone';

const FB_ORIGINS = new Set(['https://www.facebook.com', 'https://web.facebook.com']);

declare global {
  interface Window {
    FB?: {
      init: (opts: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
        autoLogAppEvents?: boolean;
      }) => void;
      login: (
        cb: (response: { authResponse?: { code?: string } }) => void,
        opts: Record<string, unknown>,
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

function buildSignupExtras(mode: EmbeddedSignupMode, wabaId?: string) {
  const setup: Record<string, unknown> = {};

  if (mode === 'add-phone' && wabaId) {
    setup.whatsAppBusinessAccount = { ids: wabaId };
  }

  return {
    setup,
    featureType: '',
    sessionInfoVersion: 3,
  };
}

export function EmbeddedSignupButton({
  appId,
  className,
  mode = 'connect',
  wabaId: existingWabaId,
}: {
  appId: string;
  className?: string;
  mode?: EmbeddedSignupMode;
  /** Required when mode is add-phone — targets the linked WABA in Meta Embedded Signup */
  wabaId?: string;
}) {
  const w = useTranslations().whatsapp;
  const isAddPhone = mode === 'add-phone';
  const { data: config, isError: configError, error: configLoadError } =
    useEmbeddedSignupConfig();
  const { connectMutation } = useWhatsappMutations(appId);
  const [sdkReady, setSdkReady] = useState(false);
  const [launching, setLaunching] = useState(false);
  const signupMetaRef = useRef<{ wabaId?: string; phoneNumberId?: string }>({});

  const initSdk = useCallback(() => {
    if (!config?.appId || !window.FB) return;
    window.FB.init({
      appId: config.appId,
      cookie: true,
      xfbml: true,
      autoLogAppEvents: true,
      version: 'v25.0',
    });
    setSdkReady(true);
  }, [config?.appId]);

  useEffect(() => {
    if (window.FB && config?.appId) initSdk();
  }, [config?.appId, initSdk]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!FB_ORIGINS.has(event.origin)) return;
      try {
        const payload =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (payload?.type !== 'WA_EMBEDDED_SIGNUP') return;

        if (payload.event === 'FINISH' || payload.event === 'FINISH_ONLY_WABA') {
          signupMetaRef.current = {
            wabaId: payload.data?.waba_id,
            phoneNumberId: payload.data?.phone_number_id,
          };
        }
      } catch {
        // ignore non-JSON messages from Facebook SDK
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  async function handleConnect() {
    if (!config?.configId || !config.appId) {
      appToast.error(w.errorMetaConfig);
      return;
    }
    if (!window.FB) {
      appToast.error(w.errorMetaSdk);
      return;
    }

    signupMetaRef.current = {};
    setLaunching(true);

    window.FB.login(
      (response) => {
        const code = response.authResponse?.code;
        if (!code) {
          setLaunching(false);
          return;
        }

        const { wabaId: signupWabaId } = signupMetaRef.current;
        const wabaId = isAddPhone
          ? existingWabaId ?? signupWabaId
          : signupWabaId ?? existingWabaId;

        connectMutation.mutate(
          { code, wabaId },
          {
            onSuccess: () => {
              appToast.success(isAddPhone ? w.addPhoneSuccess : w.connected);
              setLaunching(false);
            },
            onError: (err) => {
              appToast.error(
                getApiErrorMessage(err, isAddPhone ? w.addPhoneFailed : w.errorConnect),
              );
              setLaunching(false);
            },
          },
        );
      },
      {
        config_id: String(config.configId),
        response_type: 'code',
        override_default_response_type: true,
        extras: buildSignupExtras(mode, existingWabaId),
      },
    );
  }

  const disabled =
    configError ||
    !config?.appId ||
    !config?.configId ||
    !sdkReady ||
    launching ||
    connectMutation.isPending ||
    (isAddPhone && !existingWabaId);

  const pending = launching || connectMutation.isPending;
  const label = pending
    ? isAddPhone
      ? w.addingPhone
      : w.connecting
    : isAddPhone
      ? w.addPhone
      : w.connect;

  return (
    <>
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="lazyOnload"
        onLoad={() => {
          window.fbAsyncInit = initSdk;
          initSdk();
        }}
      />
      {configError ? (
        <p className="text-xs text-[var(--danger)]">
          {getApiErrorMessage(configLoadError, w.errorMetaConfig)}
        </p>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => void handleConnect()}
        className={cn(
          'inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isAddPhone ? (
          <Plus className="size-4" />
        ) : (
          <Link2 className="size-4" />
        )}
        {label}
      </button>
    </>
  );
}
