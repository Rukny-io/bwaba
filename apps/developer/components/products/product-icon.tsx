import Image from 'next/image';
import { FileText, Mail } from 'lucide-react';
import type { DeveloperProductId } from '@/lib/developer-products';
import { cn } from '@/lib/utils';

const PLATFORM_SVG: Partial<Record<DeveloperProductId, string>> = {
  whatsappApi: '/products/whatsapp-api.svg',
  whatsapp: '/products/whatsapp.svg',
  instagram: '/products/instagram.svg',
  messenger: '/products/messenger.svg',
};

export function ProductIcon({
  productId,
  className,
  lucideClassName,
  size = 20,
  strokeWidth = 1.7,
}: {
  productId: DeveloperProductId;
  className?: string;
  /** Lucide stroke icons (forms, email) */
  lucideClassName?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const svgSrc = PLATFORM_SVG[productId];

  if (svgSrc) {
    return (
      <Image
        src={svgSrc}
        alt=""
        width={size}
        height={size}
        className={cn('object-contain', className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  if (productId === 'forms') {
    return (
      <FileText
        className={cn(lucideClassName)}
        size={size}
        strokeWidth={strokeWidth}
        aria-hidden
      />
    );
  }

  if (productId === 'emailApi') {
    return (
      <Mail
        className={cn(lucideClassName)}
        size={size}
        strokeWidth={strokeWidth}
        aria-hidden
      />
    );
  }

  return null;
}

export function usesPlatformSvg(productId: DeveloperProductId): boolean {
  return productId in PLATFORM_SVG;
}
