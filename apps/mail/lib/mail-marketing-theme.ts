export const mailBrand = {
  brand: "#062c30",
  teal: "#02797E",
  text: "#1c1917",
  muted: "#57534e",
  tertiary: "#a8a29e",
  border: "#e7e5e4",
  canvas: "#fbfbfc",
  paper: "#ffffff",
  surface: "#f2f3f6",
  soft: "#eef2f2",
  /** Dark-mode primary (console) */
  brandDark: "#3d9ea3",
  tealDark: "#4db5b9",
  canvasDark: "#0b1213",
  surfaceDark: "#121a1b",
} as const;

export const mailMarketingLayout = {
  container: "mail-mkt-container relative mx-auto w-full max-w-6xl px-4 sm:px-8",
  heroPad: "px-4 pb-10 pt-10 sm:px-8 sm:pb-14 sm:pt-14 md:pt-16",
  heroBadge:
    "text-xs font-medium uppercase tracking-[1.8px] text-[#02797E]",
  heroTitle:
    "text-balance text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] text-[#1c1917] sm:text-5xl md:text-[3.5rem] lg:text-[4rem]",
  heroLead:
    "max-w-xl text-[15px] leading-[1.6] text-[#57534e] sm:text-base md:text-lg",
  section:
    "scroll-mt-24 border-t border-[#e7e5e4] px-4 py-16 sm:px-8 sm:py-20 md:py-24",
  eyebrow:
    "mb-3 text-xs font-medium uppercase tracking-[1.8px] text-[#02797E]",
  sectionTitle:
    "text-[1.75rem] font-bold leading-[1.15] tracking-[-0.03em] text-[#1c1917] sm:text-3xl md:text-[2.5rem]",
  sectionLead: "mt-4 max-w-2xl text-[15px] leading-[1.7] text-[#57534e] sm:text-base",
  /** Base frame CTA — pair with MailFrameCta for corner ticks */
  btnPrimary:
    "mail-frame-cta mail-frame-cta--primary inline-flex items-center justify-center gap-2 border border-[#062c30] bg-[#062c30] px-5 py-2.5 text-[15px] font-medium leading-[1.4] text-white transition-colors duration-200 hover:border-[#1c1917] hover:bg-[#1c1917]",
  btnGhost:
    "mail-frame-cta mail-frame-cta--ghost inline-flex items-center justify-center gap-2 border border-[#e7e5e4] bg-transparent px-5 py-2.5 text-[15px] font-medium leading-[1.4] text-[#57534e] transition-colors duration-200 hover:border-[#1c1917]/25 hover:text-[#1c1917]",
  btnNav:
    "mail-frame-cta mail-frame-cta--primary inline-flex h-9 items-center justify-center border border-[#062c30] bg-[#062c30] px-4 text-[13px] font-medium text-white transition-colors duration-200 hover:border-[#1c1917] hover:bg-[#1c1917]",
  gridFrame: "grid gap-px overflow-hidden border border-[#e7e5e4] bg-[#e7e5e4]",
  cell: "bg-[#fbfbfc] p-5 sm:p-6",
  panel: "border border-[#e7e5e4] bg-white",
} as const;
