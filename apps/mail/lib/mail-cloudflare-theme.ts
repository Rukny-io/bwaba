/** Cloudflare homepage visual language — adapted for Rukny Mail content. */
export const cf = {
  orange: "#F6821F",
  orangeHover: "#E5700F",
  orangeSoft: "#FFF4EB",
  ink: "#0B0D0E",
  inkSoft: "#14181A",
  cream: "#F6F6F4",
  white: "#FFFFFF",
  text: "#1D1D1D",
  muted: "#6B6F76",
  border: "#E4E4E7",
  borderDark: "rgba(255,255,255,0.12)",
} as const;

export const cfLayout = {
  container: "mx-auto w-full max-w-[1200px] px-5 sm:px-8",
  section: "py-16 sm:py-20 md:py-24",
  heroTitle:
    "text-balance text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-[3.25rem] md:text-[4rem] lg:text-[4.5rem]",
  sectionTitle:
    "text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.04em] text-[#1D1D1D] sm:text-[2.5rem] md:text-[3rem]",
  sectionTitleOnDark:
    "text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[2.5rem] md:text-[3rem]",
  lead: "text-[16px] leading-[1.65] text-[#6B6F76] sm:text-[17px]",
  leadOnDark: "text-[16px] leading-[1.65] text-white/65 sm:text-[17px]",
  btnPrimary:
    "inline-flex h-11 items-center justify-center rounded-full bg-[#F6821F] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-[#E5700F]",
  btnSecondary:
    "inline-flex h-11 items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 text-[14px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10",
  btnPrimaryLight:
    "inline-flex h-11 items-center justify-center rounded-full bg-[#F6821F] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-[#E5700F]",
  btnGhostLight:
    "inline-flex h-11 items-center justify-center rounded-full px-5 text-[14px] font-semibold text-[#1D1D1D] transition-colors hover:bg-black/[0.04]",
  pill:
    "inline-flex items-center rounded-full border border-[#E4E4E7] bg-white px-3 py-1 text-[12px] font-medium text-[#6B6F76]",
  card: "rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
  cardDark:
    "rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm",
} as const;
