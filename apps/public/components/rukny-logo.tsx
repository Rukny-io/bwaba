import Image from 'next/image';

export function RuknyLogo({
  className = 'h-8 w-8',
}: {
  className?: string;
}) {
  return (
    <Image
      src="/rukny-logo.svg"
      alt="Rukny Solutions"
      width={32}
      height={32}
      className={className}
      priority
    />
  );
}
