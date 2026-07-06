import type { LucideIcon } from 'lucide-react';
import {
  FileText,
  Mail,
  MessageCircle,
  Instagram,
  Facebook,
  Radio,
} from 'lucide-react';
import { appForms, appWhatsapp, appWhatsappApi } from '@/lib/app-routes';

export type ProductStatus = 'available' | 'coming_soon';

export type DeveloperProductId =
  | 'forms'
  | 'whatsappApi'
  | 'whatsapp'
  | 'instagram'
  | 'messenger'
  | 'emailApi';

export interface DeveloperProduct {
  id: DeveloperProductId;
  icon: LucideIcon;
  status: ProductStatus;
  /** مسار داخلي يعتمد على appId */
  resolveHref?: (appId: string) => string;
  /** رابط خارجي ثابت */
  externalHref?: string;
}

export const DEVELOPER_PRODUCTS: DeveloperProduct[] = [
  {
    id: 'forms',
    icon: FileText,
    status: 'available',
    resolveHref: (appId) => appForms(appId),
  },
  {
    id: 'whatsappApi',
    icon: Radio,
    status: 'available',
    resolveHref: (appId) => appWhatsappApi(appId),
  },
  {
    id: 'whatsapp',
    icon: MessageCircle,
    status: 'available',
    resolveHref: (appId) => appWhatsapp(appId),
  },
  {
    id: 'instagram',
    icon: Instagram,
    status: 'coming_soon',
  },
  {
    id: 'messenger',
    icon: Facebook,
    status: 'coming_soon',
  },
  {
    id: 'emailApi',
    icon: Mail,
    status: 'coming_soon',
  },
];

export function getDeveloperProduct(id: string): DeveloperProduct | undefined {
  return DEVELOPER_PRODUCTS.find((product) => product.id === id);
}

export function resolveProductHref(
  product: DeveloperProduct,
  appId: string,
): string | null {
  if (product.externalHref) return product.externalHref;
  if (product.resolveHref) return product.resolveHref(appId);
  return null;
}
