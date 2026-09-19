/** Marketing layout tokens — aligned with apps/mail mail-marketing-theme. */

export const developerMarketingLayout = {
  container: 'dev-mkt-container relative mx-auto w-full max-w-6xl px-4 sm:px-8',
  heroBadge:
    'text-xs font-medium uppercase tracking-[1.8px] text-[#666666]',
  heroTitle:
    'text-balance text-[2rem] font-bold leading-[1.05] tracking-[-0.04em] text-[#111111] sm:text-5xl md:text-[3.25rem]',
  heroLead:
    'max-w-xl text-[14px] leading-[1.6] text-[#666666] sm:text-[15px]',
  eyebrow:
    'mb-3 text-xs font-medium uppercase tracking-[1.8px] text-[#666666]',
  sectionTitle:
    'text-[1.75rem] font-bold leading-[1.15] tracking-[-0.03em] text-[#111111] sm:text-3xl md:text-[2.5rem]',
  sectionLead:
    'mt-4 max-w-2xl text-[15px] leading-[1.7] text-[#666666] sm:text-base',
  gridFrame: 'grid gap-px overflow-hidden border border-[#e8e8e8] bg-[#e8e8e8]',
  cell: 'bg-[#fafafa] p-5 sm:p-6',
  cellPaper: 'bg-white p-5 sm:p-6',
  panel: 'border border-[#e8e8e8] bg-white',
} as const;
