import { isWhatsappApiProductPath } from '@/lib/whatsapp-api-routes';
import { isWhatsappProductPath } from '@/lib/whatsapp-routes';

export function usesBottomIslandNav(pathname: string): boolean {
  return (
    isWhatsappProductPath(pathname) || isWhatsappApiProductPath(pathname)
  );
}
