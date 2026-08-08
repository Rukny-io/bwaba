/** Shared elevated card surface for form detail panels and rows */
export const formDetailCardSurfaceClass =
  'rounded-[25px] border border-[rgba(0,0,0,0.06)] bg-white p-[12px] shadow-[0px_10px_18px_-4px_rgba(0,0,0,0.06)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none';

export const formDetailCardClass = `flex flex-col gap-[12px] ${formDetailCardSurfaceClass}`;

/** Inset surface for nested answer/value rows inside submission cards */
export const submissionAnswerInsetClass =
  'rounded-xl border border-[rgba(0,0,0,0.06)] bg-[var(--surface-secondary)]/40 px-3.5 py-2.5 text-sm text-[var(--foreground)] dark:border-zinc-800 dark:bg-zinc-900/50';
