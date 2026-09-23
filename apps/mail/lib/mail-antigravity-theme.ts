/** Google Antigravity–inspired marketing tokens for Rukny Mail. */
export const ag = {
  white: "#FFFFFF",
  surface: "#FAFAFA",
  ink: "#1D1D1D",
  inkStrong: "#0A0A0A",
  muted: "#6B6F76",
  faint: "#9CA3AF",
  border: "#E8E8E8",
  borderLight: "#F0F0F0",
  /** Gemini spectrum */
  geminiBlue: "#4285F4",
  geminiRed: "#EA4335",
  geminiYellow: "#FBBC04",
  geminiGreen: "#34A853",
} as const;

export const agSpectrum = [
  ag.geminiBlue,
  ag.geminiRed,
  ag.geminiYellow,
  ag.geminiGreen,
] as const;

export const agLayout = {
  container: "mx-auto w-full max-w-[1200px] px-5 sm:px-8",
  section: "py-20 sm:py-24 md:py-28",
  heroTitle:
    "text-balance text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.1] tracking-[0em] text-[#1D1D1D]",
  sectionTitle:
    "text-balance text-[clamp(1.75rem,4vw,2rem)] font-medium leading-[1.1] tracking-[0em] text-[#1D1D1D]",
  lead: "text-[1rem] font-normal leading-[1.5] tracking-[0em] text-[#6B6F76]",
  btnPrimary:
    "inline-flex h-11 items-center justify-center rounded-full bg-[#1D1D1D] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#0A0A0A]",
  btnSecondary:
    "inline-flex h-11 items-center justify-center rounded-full border border-[#E8E8E8] bg-white px-6 text-[14px] font-medium text-[#1D1D1D] transition-colors hover:bg-[#FAFAFA]",
  btnGhost:
    "inline-flex h-9 items-center justify-center rounded-full px-3.5 text-[14px] font-medium text-[#6B6F76] transition-colors hover:bg-[#F5F5F5] hover:text-[#1D1D1D]",
  pill:
    "inline-flex items-center rounded-full border border-[#E8E8E8] bg-white px-3 py-1 text-[12px] font-medium text-[#6B6F76]",
  card:
    "rounded-2xl border border-[#E8E8E8] bg-white p-6 transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]",
} as const;
