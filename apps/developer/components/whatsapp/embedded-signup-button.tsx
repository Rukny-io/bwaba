'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import Script from 'next/script';
import { Loader2, Link2, Plus } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { useEmbeddedSignupConfig, useWhatsappMutations } from '@/hooks/use-whatsapp';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import type { WhatsappAccountSummary } from '@/lib/api/types';
import { cn } from '@/lib/utils';

export type EmbeddedSignupMode = 'connect' | 'add-phone';

const FB_ORIGINS = new Set(['https://www.facebook.com', 'https://web.facebook.com']);
/** Wait briefly for WA_EMBEDDED_SIGNUP FINISH before exchanging the code. */
const SIGNUP_META_WAIT_MS = 5000;
const SIGNUP_META_POLL_MS = 50;
const SDK_READY_WAIT_MS = 12_000;
const SDK_READY_POLL_MS = 100;
const LOGIN_CALLBACK_TIMEOUT_MS = 5 * 60_000;

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
        cb: (response: { authResponse?: { code?: string }; status?: string }) => void,
        opts: Record<string, unknown>,
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

function buildSignupExtras(
  mode: EmbeddedSignupMode,
  options?: { wabaId?: string; solutionId?: string | null },
) {
  const setup: Record<string, unknown> = {};

  if (mode === 'add-phone' && options?.wabaId) {
    setup.whatsAppBusinessAccount = { ids: [options.wabaId] };
  }

  // Multi-Partner Solution (YCloud) — attaches BSP credit line on new WABAs
  if (options?.solutionId) {
    setup.solutionID = options.solutionId;
  }

  return {
    setup,
    featureType: '',
    sessionInfoVersion: 3,
  };
}

function notifyConnectSuccess(
  account: WhatsappAccountSummary,
  isAddPhone: boolean,
  w: {
    connected: string;
    addPhoneSuccess: string;
    addPhoneLinked: string;
    addPhoneLinkedDesc: string;
    addPhoneSyncPending: string;
    addPhoneSyncPendingDesc: string;
    pinGeneratedTitle: string;
    pinGeneratedDesc: string;
    paymentRequiredTitle: string;
    paymentRequiredToast: string;
  },
) {
  const phoneCount = account.phoneNumbers?.length ?? 0;
  const pendingRegister = (account.registrationPins ?? []).some(
    (p) => !p.registered && !p.alreadyRegistered,
  );

  if (isAddPhone) {
    if (phoneCount === 0) {
      appToast.info(w.addPhoneSyncPending, {
        description: w.addPhoneSyncPendingDesc.replace(
          '{wabaId}',
          account.wabaId ?? '—',
        ),
      });
    } else if (pendingRegister) {
      appToast.success(w.addPhoneLinked, {
        description: w.addPhoneLinkedDesc,
      });
    } else {
      appToast.success(w.addPhoneSuccess);
    }
  } else {
    appToast.success(w.connected);
  }

  notifyOnboarding(account, w);
}

function notifyOnboarding(
  account: WhatsappAccountSummary,
  w: {
    pinGeneratedTitle: string;
    pinGeneratedDesc: string;
    paymentRequiredTitle: string;
    paymentRequiredToast: string;
  },
) {
  const pins = (account.registrationPins || []).filter((p) => p.pin && p.registered);
  if (pins.length > 0) {
    const first = pins[0];
    appToast.success(w.pinGeneratedTitle, {
      description: w.pinGeneratedDesc.replace('{pin}', first.pin),
    });
  }

  if (account.onboarding?.paymentMethodRequired !== false) {
    appToast.info(w.paymentRequiredTitle, {
      description: w.paymentRequiredToast,
    });
  }
}

function waitForSignupMeta(
  ref: MutableRefObject<{ wabaId?: string; phoneNumberId?: string }>,
  timeoutMs = SIGNUP_META_WAIT_MS,
): Promise<{ wabaId?: string; phoneNumberId?: string }> {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      const meta = ref.current;
      if (meta.wabaId || meta.phoneNumberId) {
        resolve({ ...meta });
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        resolve({ ...meta });
        return;
      }
      window.setTimeout(tick, SIGNUP_META_POLL_MS);
    };
    tick();
  });
}

function waitUntil(
  predicate: () => boolean,
  timeoutMs: number,
  pollMs = SDK_READY_POLL_MS,
): Promise<boolean> {
  return new Promise((resolve) => {
    if (predicate()) {
      resolve(true);
      return;
    }
    const started = Date.now();
    const tick = () => {
      if (predicate()) {
        resolve(true);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        resolve(false);
        return;
      }
      window.setTimeout(tick, pollMs);
    };
    window.setTimeout(tick, pollMs);
  });
}

export function EmbeddedSignupButton({
  appId,
  className,
  mode = 'connect',
  wabaId: existingWabaId,
  compact = false,
  variant = 'primary',
}: {
  appId: string;
  className?: string;
  mode?: EmbeddedSignupMode;
  /** Required when mode is add-phone — targets the linked WABA in Meta Embedded Signup */
  wabaId?: string;
  /** Hide verbose loading/status copy — keep a compact control for toolbars. */
  compact?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const w = useTranslations().whatsapp;
  const isAddPhone = mode === 'add-phone';
  const {
    data: config,
    isError: configError,
    isLoading: configLoading,
    isFetching: configFetching,
    error: configLoadError,
    refetch: refetchConfig,
  } = useEmbeddedSignupConfig();
  const { connectMutation } = useWhatsappMutations(appId);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);
  const [launching, setLaunching] = useState(false);
  const signupMetaRef = useRef<{ wabaId?: string; phoneNumberId?: string }>({});
  const initDoneRef = useRef(false);
  const loginTimeoutRef = useRef<number | null>(null);

  const graphVersion = config?.graphApiVersion?.replace(/^v/, '') || '25.0';
  const sdkVersion = graphVersion.startsWith('v') ? graphVersion : `v${graphVersion}`;

  const clearLoginTimeout = useCallback(() => {
    if (loginTimeoutRef.current != null) {
      window.clearTimeout(loginTimeoutRef.current);
      loginTimeoutRef.current = null;
    }
  }, []);

  const initSdk = useCallback(() => {
    if (!config?.appId || !window.FB) return false;

    if (initDoneRef.current) {
      setSdkReady(true);
      setSdkFailed(false);
      return true;
    }

    try {
      window.FB.init({
        appId: config.appId,
        cookie: true,
        xfbml: false,
        autoLogAppEvents: true,
        version: sdkVersion,
      });
      initDoneRef.current = true;
      setSdkReady(true);
      setSdkFailed(false);
      return true;
    } catch {
      setSdkFailed(true);
      setSdkReady(false);
      return false;
    }
  }, [config?.appId, sdkVersion]);

  // Meta expects fbAsyncInit before the script may finish loading.
  useEffect(() => {
    if (!config?.appId) return;
    window.fbAsyncInit = () => {
      initSdk();
    };
    if (window.FB) initSdk();
  }, [config?.appId, initSdk]);

  // Fail clearly if the Facebook SDK never becomes ready.
  useEffect(() => {
    if (!config?.appId || sdkReady || sdkFailed) return;

    const timer = window.setTimeout(() => {
      if (!window.FB || !initSdk()) {
        setSdkFailed(true);
      }
    }, SDK_READY_WAIT_MS);

    return () => window.clearTimeout(timer);
  }, [config?.appId, sdkReady, sdkFailed, initSdk]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!FB_ORIGINS.has(event.origin)) return;
      try {
        const payload =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (payload?.type !== 'WA_EMBEDDED_SIGNUP') return;

        if (
          payload.event === 'FINISH' ||
          payload.event === 'FINISH_ONLY_WABA' ||
          payload.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'
        ) {
          signupMetaRef.current = {
            wabaId: payload.data?.waba_id
              ? String(payload.data.waba_id)
              : undefined,
            phoneNumberId: payload.data?.phone_number_id
              ? String(payload.data.phone_number_id)
              : undefined,
          };
        }
      } catch {
        // ignore non-JSON messages from Facebook SDK
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => () => clearLoginTimeout(), [clearLoginTimeout]);

  const configMissing =
    !configLoading && !configFetching && (!config?.appId || !config?.configId);
  const addPhoneBlocked = isAddPhone && !existingWabaId;
  const preparing =
    configLoading || configFetching || (!!config?.appId && !sdkReady && !sdkFailed);
  const blocked = configError || configMissing || sdkFailed || addPhoneBlocked;
  const busy = launching || connectMutation.isPending || preparing;
  const disabled = blocked || busy;

  async function ensureSdkReady(): Promise<boolean> {
    if (sdkReady && window.FB) return true;
    if (window.FB && initSdk()) return true;

    const ready = await waitUntil(
      () => Boolean(window.FB && (initDoneRef.current || initSdk())),
      SDK_READY_WAIT_MS,
    );
    return ready;
  }

  async function handleConnect() {
    if (configError || configMissing) {
      appToast.error(getApiErrorMessage(configLoadError, w.errorMetaConfig));
      void refetchConfig();
      return;
    }

    if (configLoading || configFetching || !config?.configId || !config.appId) {
      appToast.info(w.sdkLoadingConfig);
      return;
    }

    if (addPhoneBlocked) {
      appToast.error(w.addPhoneNeedsWaba);
      return;
    }

    if (sdkFailed) {
      appToast.error(w.errorMetaSdk);
      return;
    }

    setLaunching(true);
    const ready = await ensureSdkReady();
    if (!ready || !window.FB) {
      setSdkFailed(true);
      setLaunching(false);
      appToast.error(w.errorMetaSdk);
      return;
    }

    signupMetaRef.current = {};
    clearLoginTimeout();
    loginTimeoutRef.current = window.setTimeout(() => {
      setLaunching(false);
      appToast.info(w.connectCancelled);
    }, LOGIN_CALLBACK_TIMEOUT_MS);

    window.FB.login(
      (response) => {
        void (async () => {
          clearLoginTimeout();
          const code = response.authResponse?.code;
          if (!code) {
            setLaunching(false);
            if (response.status === 'unknown' || !response.authResponse) {
              appToast.info(w.connectCancelled);
            } else {
              appToast.error(w.errorConnectNoCode);
            }
            return;
          }

          const signupMeta = await waitForSignupMeta(signupMetaRef);
          const wabaId = isAddPhone
            ? existingWabaId ?? signupMeta.wabaId
            : signupMeta.wabaId ?? existingWabaId;

          connectMutation.mutate(
            {
              code,
              wabaId,
              phoneNumberId: signupMeta.phoneNumberId,
            },
            {
              onSuccess: (account) => {
                notifyConnectSuccess(account, isAddPhone, w);
                setLaunching(false);
              },
              onError: (err) => {
                appToast.error(
                  getApiErrorMessage(
                    err,
                    isAddPhone ? w.addPhoneFailed : w.errorConnect,
                  ),
                );
                setLaunching(false);
              },
            },
          );
        })();
      },
      {
        config_id: String(config.configId),
        response_type: 'code',
        override_default_response_type: true,
        extras: buildSignupExtras(mode, {
          wabaId: existingWabaId,
          solutionId: config.solutionId,
        }),
      },
    );
  }

  const pending = launching || connectMutation.isPending;
  const label = pending
    ? isAddPhone
      ? w.addingPhone
      : w.connecting
    : preparing && !compact
      ? w.sdkLoading
      : isAddPhone
        ? w.addPhone
        : w.connect;

  let statusHint: string | null = null;
  if (configError) {
    statusHint = getApiErrorMessage(configLoadError, w.errorMetaConfig);
  } else if (configMissing) {
    statusHint = w.errorMetaConfig;
  } else if (sdkFailed) {
    statusHint = w.errorMetaSdk;
  } else if (addPhoneBlocked) {
    statusHint = w.addPhoneNeedsWaba;
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-1.5',
        compact ? 'items-stretch' : 'items-stretch sm:items-end',
      )}
    >
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.fbAsyncInit = () => {
            initSdk();
          };
          initSdk();
        }}
        onError={() => setSdkFailed(true)}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => void handleConnect()}
        title={statusHint ?? (preparing ? w.sdkLoading : undefined)}
        className={cn(
          'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3.5 text-[13px] font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-40',
          variant === 'secondary'
            ? 'bg-[var(--surface-secondary)] text-[var(--foreground)] transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_85%,var(--foreground)_6%)]'
            : 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90',
          !compact && 'min-w-[10.5rem]',
          className,
        )}
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : isAddPhone ? (
          <Plus className="size-3.5" />
        ) : (
          <Link2 className="size-3.5" />
        )}
        {label}
      </button>
      {!compact && statusHint ? (
        <p className="max-w-sm text-xs leading-relaxed text-[var(--danger)]">{statusHint}</p>
      ) : null}
    </div>
  );
}
