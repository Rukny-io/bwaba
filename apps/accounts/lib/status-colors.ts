/** Shared semantic status colors — always pair light + dark variants. */

export const status = {
  success: "text-emerald-600 dark:text-emerald-400",
  successIcon: "text-emerald-600 dark:text-emerald-400",
  successHint: "text-green-600 dark:text-green-400",
  warning: "text-amber-600 dark:text-amber-400",
  warningStrong: "text-amber-700 dark:text-amber-300",
  warningBanner:
    "rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-900/90 dark:bg-amber-500/15 dark:text-amber-100/90",
  successPanel:
    "rounded-xl bg-emerald-500/10 p-3 text-center text-sm font-medium text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
} as const;
