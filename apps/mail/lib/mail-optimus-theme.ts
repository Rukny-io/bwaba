/** Optimus-style marketing tokens for Rukny Mail home. */
export const opt = {
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  ink: "#0A0A0A",
  muted: "#737373",
  faint: "#A3A3A3",
  border: "#E5E5E5",
  borderStrong: "#D4D4D4",
  accent: "#0A0A0A",
} as const;

export const optLayout = {
  container: "mx-auto w-full max-w-[1120px] px-5 sm:px-8",
  section: "py-20 sm:py-24 md:py-28",
  eyebrow:
    "text-[12px] font-medium uppercase tracking-[0.14em] text-[#737373]",
  title:
    "text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.04em] text-[#0A0A0A] sm:text-[2.5rem] md:text-[3rem]",
  titleLg:
    "text-balance text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.045em] text-[#0A0A0A] sm:text-[3.5rem] md:text-[4.25rem] lg:text-[4.75rem]",
  lead: "text-[16px] leading-[1.7] text-[#737373] sm:text-[17px]",
  card: "rounded-2xl border border-[#E5E5E5] bg-white p-6 sm:p-7",
  btnPrimary:
    "inline-flex h-11 items-center justify-center rounded-full bg-[#0A0A0A] px-6 text-[14px] font-medium text-white transition-colors hover:bg-black",
  btnSecondary:
    "inline-flex h-11 items-center justify-center rounded-full border border-[#E5E5E5] bg-white px-6 text-[14px] font-medium text-[#0A0A0A] transition-colors hover:bg-[#FAFAFA]",
  btnGhost:
    "inline-flex h-10 items-center justify-center rounded-full px-4 text-[14px] font-medium text-[#737373] transition-colors hover:text-[#0A0A0A]",
} as const;
