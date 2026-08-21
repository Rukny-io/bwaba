/**
 * Session-aware fetch for Mail — refresh on 401, then auto-logout on terminal session errors.
 */

import { notifySessionExpiredAndRedirect } from "@/lib/auth-notify";
import {
  clearCsrfToken,
  getCsrfToken,
  setCsrfToken,
} from "@rukny/auth/client/csrf-cookie";

const REFRESH_STATE_KEY = "__mail_refresh_state__";
const REFRESH_BLOCK_KEY = "rukny_mail_auth_block";

interface RefreshState {
  refreshFailed: boolean;
  refreshPromise: Promise<boolean> | null;
}

function getGlobalRefreshState(): RefreshState {
  if (typeof window === "undefined") {
    return { refreshFailed: false, refreshPromise: null };
  }
  const w = window as unknown as Record<string, RefreshState>;
  if (!w[REFRESH_STATE_KEY]) {
    w[REFRESH_STATE_KEY] = { refreshFailed: false, refreshPromise: null };
  }
  return w[REFRESH_STATE_KEY];
}

/** Reset client auth state after a fresh login (login page / callback). */
export function resetAuthClientState(): void {
  if (typeof window === "undefined") return;
  clearCsrfToken();
  try {
    localStorage.removeItem(REFRESH_BLOCK_KEY);
  } catch {
    /* ignore */
  }
  const state = getGlobalRefreshState();
  state.refreshFailed = false;
  state.refreshPromise = null;
  try {
    delete (window as unknown as Record<string, unknown>)[
      "__mail_auth_redirect_lock__"
    ];
  } catch {
    /* ignore */
  }
}

function isRefreshBlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(REFRESH_BLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

function blockRefreshAttempts(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REFRESH_BLOCK_KEY, "1");
  } catch {
    /* ignore */
  }
}

function extractErrorMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const record = body as { message?: string | string[]; error?: string };
  const raw = record.message ?? record.error ?? "";
  return Array.isArray(raw) ? raw[0] ?? "" : raw;
}

function isTerminalSessionMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("session has been revoked") ||
    m.includes("session has expired") ||
    m.includes("session not found") ||
    m.includes("fingerprint mismatch") ||
    m.includes("invalid token type") ||
    m.includes("missing session id") ||
    m.includes("please login again") ||
    m.includes("inactive for too long")
  );
}

function handleAuthFailure(): void {
  const state = getGlobalRefreshState();
  clearCsrfToken();
  state.refreshFailed = true;
  state.refreshPromise = null;
  blockRefreshAttempts();
  notifySessionExpiredAndRedirect();
}

async function refreshOnce(): Promise<boolean> {
  const state = getGlobalRefreshState();
  if (state.refreshFailed || isRefreshBlocked()) return false;
  if (state.refreshPromise) return state.refreshPromise;

  state.refreshPromise = (async (): Promise<boolean> => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const csrf = getCsrfToken();
      if (csrf) headers["X-CSRF-Token"] = csrf;

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403 ||
          response.status === 429
        ) {
          handleAuthFailure();
        }
        return false;
      }

      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        csrf_token?: string;
      } | null;

      if (data?.success) {
        if (data.csrf_token) setCsrfToken(data.csrf_token);
        state.refreshFailed = false;
        try {
          localStorage.removeItem(REFRESH_BLOCK_KEY);
        } catch {
          /* ignore */
        }
        return true;
      }

      handleAuthFailure();
      return false;
    } catch {
      return false;
    } finally {
      getGlobalRefreshState().refreshPromise = null;
    }
  })();

  return state.refreshPromise;
}

/**
 * Fetch with credentials + one refresh retry + immediate logout on terminal session errors.
 */
export async function sessionFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const method = (init.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const csrf = getCsrfToken();
    if (csrf && !headers.has("X-CSRF-Token")) {
      headers.set("X-CSRF-Token", csrf);
    }
  }

  let response = await fetch(input, {
    ...init,
    credentials: "include",
    headers,
  });

  if (response.status !== 401) return response;

  const errorBody = await response.clone().json().catch(() => null);
  const sessionMessage = extractErrorMessage(errorBody);

  if (isTerminalSessionMessage(sessionMessage)) {
    handleAuthFailure();
    return response;
  }

  if (isRefreshBlocked() || getGlobalRefreshState().refreshFailed) {
    handleAuthFailure();
    return response;
  }

  const refreshed = await refreshOnce();
  if (!refreshed) return response;

  const retryHeaders = new Headers(init.headers);
  if (!retryHeaders.has("Accept")) retryHeaders.set("Accept", "application/json");
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const csrf = getCsrfToken();
    if (csrf) retryHeaders.set("X-CSRF-Token", csrf);
  }

  response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: retryHeaders,
  });

  if (response.status === 401) {
    const retryBody = await response.clone().json().catch(() => null);
    if (isTerminalSessionMessage(extractErrorMessage(retryBody))) {
      handleAuthFailure();
    }
  }

  return response;
}
