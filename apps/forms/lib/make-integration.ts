const DEFAULT_MAKE_INTEGRATION_URL =
  'https://www.make.com/en/integrations/rukny?pc=ruknyforms';

/** Make.com partner integration page — opens in a new tab from the Connect button. */
export function getMakeIntegrationUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MAKE_INTEGRATION_URL?.trim() ||
    DEFAULT_MAKE_INTEGRATION_URL
  );
}

export function openMakeIntegration(): void {
  window.open(getMakeIntegrationUrl(), '_blank', 'noopener,noreferrer');
}
