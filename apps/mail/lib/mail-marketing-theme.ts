export const mailBrand = {
  deep: "#111111",
  brand: "#111111",
  teal: "#111111",
  lagoon: "#666666",
  text: "#111111",
  muted: "#666666",
  tertiary: "#999999",
  border: "#e8e8e8",
  canvas: "#fafafa",
  paper: "#ffffff",
  surface: "#f5f5f5",
  soft: "#f5f5f5",
  mist: "#e8e8e8",
  brandDark: "#f5f5f5",
  tealDark: "#a3a3a3",
  canvasDark: "#0a0a0a",
  surfaceDark: "#171717",
} as const;

export const mailMarketingLayout = {
  container: "mail-mkt-container relative mx-auto w-full max-w-6xl px-4 sm:px-8",
  heroPad: "px-4 pb-8 pt-8 sm:px-8 sm:pb-12 sm:pt-12",
  heroBadge:
    "text-xs font-medium uppercase tracking-[1.8px] text-[#666666]",
  heroTitle:
    "text-balance text-[2rem] font-bold leading-[1.05] tracking-[-0.04em] text-[#111111] sm:text-5xl md:text-[3.25rem]",
  heroLead:
    "max-w-xl text-[14px] leading-[1.6] text-[#666666] sm:text-[15px]",
  section:
    "scroll-mt-24 border-t border-[#e8e8e8] px-4 py-12 sm:px-8 sm:py-16",
  sectionMist:
    "scroll-mt-24 border-t border-[#e8e8e8] bg-[#f5f5f5] px-4 py-12 sm:px-8 sm:py-16",
  sectionInk:
    "scroll-mt-24 border-t border-[#111111] bg-[#111111] px-4 py-12 text-[#f5f5f5] sm:px-8 sm:py-16",
  eyebrow:
    "mb-3 text-xs font-medium uppercase tracking-[1.8px] text-[#666666]",
  eyebrowOnInk:
    "mb-3 text-xs font-medium uppercase tracking-[1.8px] text-[#a3a3a3]",
  sectionTitle:
    "text-[1.75rem] font-bold leading-[1.15] tracking-[-0.03em] text-[#111111] sm:text-3xl md:text-[2.5rem]",
  sectionTitleOnInk:
    "text-[1.75rem] font-bold leading-[1.15] tracking-[-0.03em] text-white sm:text-3xl md:text-[2.5rem]",
  sectionLead:
    "mt-4 max-w-2xl text-[15px] leading-[1.7] text-[#666666] sm:text-base",
  sectionLeadOnInk:
    "mt-4 max-w-2xl text-[15px] leading-[1.7] text-[#a3a3a3] sm:text-base",
  btnPrimary:
    "mail-frame-cta mail-frame-cta--primary inline-flex items-center justify-center gap-2 border border-[#111111] bg-[#111111] px-5 py-2.5 text-[15px] font-medium leading-[1.4] text-white transition-colors duration-200 hover:border-[#000000] hover:bg-[#000000]",
  btnGhost:
    "mail-frame-cta mail-frame-cta--ghost inline-flex items-center justify-center gap-2 border border-[#e8e8e8] bg-transparent px-5 py-2.5 text-[15px] font-medium leading-[1.4] text-[#666666] transition-colors duration-200 hover:border-[#111111]/30 hover:text-[#111111]",
  btnNav:
    "mail-frame-cta mail-frame-cta--primary inline-flex h-9 items-center justify-center border border-[#111111] bg-[#111111] px-4 text-[13px] font-medium text-white transition-colors duration-200 hover:border-[#000000] hover:bg-[#000000]",
  gridFrame: "grid gap-px overflow-hidden border border-[#e8e8e8] bg-[#e8e8e8]",
  cell: "bg-[#fafafa] p-5 sm:p-6",
  cellPaper: "bg-white p-5 sm:p-6",
  panel: "border border-[#e8e8e8] bg-white",
} as const;
