import Link from 'next/link';
import { cn } from '@/lib/utils';

type FrameCtaVariant = 'primary' | 'ghost';

const variantClass: Record<FrameCtaVariant, string> = {
  primary:
    'border border-[#111111] bg-[#111111] text-white group-hover:border-[#111111] group-hover:bg-[#111111]',
  ghost:
    'border border-[#e8e8e8] bg-transparent text-[#666666] group-hover:border-[#111111]/30 group-hover:text-[#111111]',
};

function CornerTicks() {
  return (
    <span className="dev-frame-ticks" aria-hidden>
      <span className="dev-frame-tick dev-frame-tick--tl dev-frame-tick--static" />
      <span className="dev-frame-tick dev-frame-tick--tr dev-frame-tick--static" />
      <span className="dev-frame-tick dev-frame-tick--bl dev-frame-tick--static" />
      <span className="dev-frame-tick dev-frame-tick--br dev-frame-tick--static" />
    </span>
  );
}

export function FrameLink({
  href,
  children,
  variant = 'primary',
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: FrameCtaVariant;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'dev-frame-cta group relative inline-flex items-center justify-center gap-2 p-1.5 focus-visible:outline-none',
        `dev-frame-cta--${variant}`,
        className,
      )}
    >
      <CornerTicks />
      <span
        className={cn(
          'relative inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[15px] font-medium leading-[1.4] transition-[color,background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          variantClass[variant],
        )}
      >
        {children}
      </span>
    </Link>
  );
}

export function FrameButton({
  children,
  variant = 'primary',
  className,
  type = 'button',
  onClick,
  'aria-pressed': ariaPressed,
}: {
  children: React.ReactNode;
  variant?: FrameCtaVariant;
  className?: string;
  type?: 'button' | 'submit';
  onClick?: () => void;
  'aria-pressed'?: boolean;
}) {
  return (
    <span
      className={cn(
        'dev-frame-cta group relative inline-flex p-1.5',
        `dev-frame-cta--${variant}`,
        className,
      )}
    >
      <CornerTicks />
      <button
        type={type}
        onClick={onClick}
        aria-pressed={ariaPressed}
        className={cn(
          'relative inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 text-[15px] font-medium leading-[1.4] transition-[color,background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          variantClass[variant],
        )}
      >
        {children}
      </button>
    </span>
  );
}
