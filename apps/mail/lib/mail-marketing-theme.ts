export const mailBrand = {
  /** Deep ink — hero accents, dark bands */
  deep: "#041f22",
  brand: "#062c30",
  teal: "#02797E",
  /** Brighter lagoon for highlights on dark */
  lagoon: "#1aabb2",
  text: "#1c1917",
  muted: "#57534e",
  tertiary: "#a8a29e",
  border: "#e7e5e4",
  canvas: "#f7faf9",
  paper: "#ffffff",
  surface: "#eef5f4",
  soft: "#e3f0ef",
  mist: "#d7ebea",
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
    "text-balance text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] text-[#041f22] sm:text-5xl md:text-[3.5rem] lg:text-[4rem]",
  heroLead:
    "max-w-xl text-[15px] leading-[1.6] text-[#4a5c5a] sm:text-base md:text-lg",
  section:
    "scroll-mt-24 border-t border-[#d7ebea] px-4 py-16 sm:px-8 sm:py-20 md:py-24",
  sectionMist:
    "scroll-mt-24 border-t border-[#d7ebea] bg-[#eef5f4] px-4 py-16 sm:px-8 sm:py-20 md:py-24",
  sectionInk:
    "scroll-mt-24 border-t border-[#062c30] bg-[#041f22] px-4 py-16 text-[#f5f5f4] sm:px-8 sm:py-20 md:py-24",
  eyebrow:
    "mb-3 text-xs font-medium uppercase tracking-[1.8px] text-[#02797E]",
  eyebrowOnInk:
    "mb-3 text-xs font-medium uppercase tracking-[1.8px] text-[#1aabb2]",
  sectionTitle:
    "text-[1.75rem] font-bold leading-[1.15] tracking-[-0.03em] text-[#041f22] sm:text-3xl md:text-[2.5rem]",
  sectionTitleOnInk:
    "text-[1.75rem] font-bold leading-[1.15] tracking-[-0.03em] text-white sm:text-3xl md:text-[2.5rem]",
  sectionLead:
    "mt-4 max-w-2xl text-[15px] leading-[1.7] text-[#4a5c5a] sm:text-base",
  sectionLeadOnInk:
    "mt-4 max-w-2xl text-[15px] leading-[1.7] text-[#a8c5c3] sm:text-base",
  btnPrimary:
    "mail-frame-cta mail-frame-cta--primary inline-flex items-center justify-center gap-2 border border-[#062c30] bg-[#062c30] px-5 py-2.5 text-[15px] font-medium leading-[1.4] text-white transition-colors duration-200 hover:border-[#041f22] hover:bg-[#041f22]",
  btnGhost:
    "mail-frame-cta mail-frame-cta--ghost inline-flex items-center justify-center gap-2 border border-[#d7ebea] bg-transparent px-5 py-2.5 text-[15px] font-medium leading-[1.4] text-[#4a5c5a] transition-colors duration-200 hover:border-[#062c30]/30 hover:text-[#041f22]",
  btnNav:
    "mail-frame-cta mail-frame-cta--primary inline-flex h-9 items-center justify-center border border-[#062c30] bg-[#062c30] px-4 text-[13px] font-medium text-white transition-colors duration-200 hover:border-[#041f22] hover:bg-[#041f22]",
  gridFrame: "grid gap-px overflow-hidden border border-[#d7ebea] bg-[#d7ebea]",
  cell: "bg-[#f7faf9] p-5 sm:p-6",
  cellPaper: "bg-white p-5 sm:p-6",
  panel: "border border-[#d7ebea] bg-white",
} as const;
