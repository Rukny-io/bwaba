/** Borderless editorial marketing tokens — mirrored from apps/web. */
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
  lead: 'text-[1rem] font-normal leading-[1.7] text-[#6B6F76]',
  eyebrow: 'text-[12px] font-medium tracking-[0.16em] text-[#9CA3AF]',
  btnPrimary:
    'relative z-10 inline-flex h-11 touch-manipulation items-center justify-center rounded-full bg-[#1D1D1D] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#0A0A0A]',
  btnSecondary:
    'relative z-10 inline-flex h-11 touch-manipulation items-center justify-center rounded-full bg-[#F5F5F5] px-6 text-[14px] font-medium text-[#1D1D1D] transition-colors hover:bg-[#EBEBEB]',
  btnGhost:
    'relative z-10 inline-flex h-9 touch-manipulation items-center justify-center rounded-full px-3.5 text-[14px] font-medium text-[#6B6F76] transition-colors hover:bg-[#F5F5F5] hover:text-[#1D1D1D]',
  surface: 'rounded-[2rem] bg-[#FAFAFA] p-6 sm:p-8 md:p-10',
  navActive: 'bg-[#F5F5F5] text-[#1D1D1D]',
  navIdle: 'text-[#6B6F76] hover:bg-[#FAFAFA] hover:text-[#1D1D1D]',
} as const;

export const productTints = {
  whatsapp: 'bg-[#ECFDF5]',
  email: 'bg-[#EFF6FF]',
  forms: 'bg-[#FFF7ED]',
} as const;
