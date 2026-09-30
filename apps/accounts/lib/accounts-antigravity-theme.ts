/** Antigravity-inspired tokens — aligned with apps/mail login. */
export const ag = {
  white: "#FFFFFF",
  surface: "#FAFAFA",
  ink: "#1D1D1D",
  inkStrong: "#0A0A0A",
  muted: "#6B6F76",
  faint: "#9CA3AF",
  border: "#E8E8E8",
} as const

export const agLayout = {
  container: "mx-auto w-full max-w-[1200px] px-5 sm:px-8",
  lead: "text-[1rem] font-normal leading-[1.5] tracking-[0em] text-[#6B6F76]",
  btnPrimary:
    "inline-flex h-11 items-center justify-center rounded-full bg-[#1D1D1D] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#0A0A0A] disabled:opacity-45",
  btnSecondary:
    "inline-flex h-11 items-center justify-center rounded-full bg-[#F5F5F5] px-6 text-[14px] font-medium text-[#1D1D1D] transition-colors hover:bg-[#EBEBEB] disabled:opacity-45",
  btnGhost:
    "inline-flex h-9 items-center justify-center rounded-full px-3.5 text-[14px] font-medium text-[#6B6F76] transition-colors hover:bg-[#F5F5F5] hover:text-[#1D1D1D]",
} as const
