/** Borderless editorial marketing tokens — aligned with apps/mail, no borders/shadows. */
export const ag = {
  white: '#FFFFFF',
  surface: '#FAFAFA',
  surfaceHover: '#F5F5F5',
  ink: '#1D1D1D',
  inkStrong: '#0A0A0A',
  muted: '#6B6F76',
  faint: '#9CA3AF',
  whisper: '#EBEBEB',
} as const;

export const agLayout = {
  container: 'mx-auto w-full max-w-[1200px] px-5 sm:px-8',
  section: 'py-24 sm:py-28 md:py-32',
  sectionWhite: 'bg-white',
  sectionMuted: 'bg-[#FAFAFA]',
  heroTitle:
    'text-balance text-[clamp(2.25rem,6vw,4.25rem)] font-medium leading-[1.08] tracking-[-0.03em] text-[#1D1D1D]',
  sectionTitle:
    'text-balance text-[clamp(1.875rem,4.5vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.03em] text-[#1D1D1D]',
  introTitle:
    'text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-[1.35] tracking-[-0.025em] text-[#1D1D1D]',
  introLead:
    'max-w-2xl text-[17px] font-normal leading-[1.85] text-[#6B6F76] sm:text-[18px] sm:leading-[1.9]',
  lead: 'text-[1rem] font-normal leading-[1.7] text-[#6B6F76]',
  eyebrow: 'text-[12px] font-medium tracking-[0.16em] text-[#9CA3AF]',
  textStack: 'flex flex-col gap-5 text-start sm:gap-7',
  index:
    'select-none text-[clamp(2.5rem,6vw,4rem)] font-medium leading-none tracking-[-0.05em] text-[#EBEBEB]',
  btnPrimary:
    'relative z-10 inline-flex h-11 touch-manipulation items-center justify-center rounded-full bg-[#1D1D1D] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#0A0A0A]',
  btnSecondary:
    'relative z-10 inline-flex h-11 touch-manipulation items-center justify-center rounded-full bg-[#F5F5F5] px-6 text-[14px] font-medium text-[#1D1D1D] transition-colors hover:bg-[#EBEBEB]',
  btnGhost:
    'relative z-10 inline-flex h-9 touch-manipulation items-center justify-center rounded-full px-3.5 text-[14px] font-medium text-[#6B6F76] transition-colors hover:bg-[#F5F5F5] hover:text-[#1D1D1D]',
  pill:
    'inline-flex items-center rounded-full bg-[#F5F5F5] px-3 py-1 text-[12px] font-medium text-[#6B6F76]',
  surface:
    'rounded-[2rem] bg-[#FAFAFA] p-6 sm:p-8 md:p-10',
  navActive: 'bg-[#F5F5F5] text-[#1D1D1D]',
  navIdle: 'text-[#6B6F76] hover:bg-[#FAFAFA] hover:text-[#1D1D1D]',
} as const;

export const productTints = {
  stores: 'bg-[#FFF7ED]',
  forms: 'bg-[#EFF6FF]',
  profile: 'bg-[#ECFDF5]',
  analytics: 'bg-[#F5F3FF]',
  ai: 'bg-[#F0FDFA]',
} as const;

export const useCaseTints = {
  ecommerce: 'bg-[#EFF6FF]',
  personal: 'bg-[#FEF2F2]',
  teams: 'bg-[#ECFDF5]',
} as const;
