import Image from 'next/image';

const LOGO_BOX =
  'flex h-4 w-[72px] shrink-0 items-center justify-center min-[720px]:h-5 min-[720px]:w-[88px] min-[1280px]:h-6 min-[1280px]:w-[100px]';

const TRUSTED_LOGOS = [
  { src: '/Trusted/Logo.svg', alt: 'Google', width: 140, height: 44 },
  {
    src: `/Trusted/${encodeURIComponent('Amazon Web Services.svg')}`,
    alt: 'Amazon Web Services',
    width: 120,
    height: 72,
  },
  { src: '/Trusted/LinkedIn.svg', alt: 'LinkedIn', width: 268, height: 65 },
  { src: '/Trusted/Meta.svg', alt: 'Meta', width: 89, height: 19 },
] as const;

export function HeroTrustLogos() {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 min-[720px]:gap-x-12">
      {TRUSTED_LOGOS.map(({ src, alt, width, height }) => (
        <li key={src} className={LOGO_BOX}>
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="h-auto w-auto max-h-full max-w-full object-contain opacity-45 grayscale dark:opacity-65 dark:brightness-125"
          />
        </li>
      ))}
    </ul>
  );
}
