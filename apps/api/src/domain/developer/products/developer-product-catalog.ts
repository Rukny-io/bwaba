export const DEVELOPER_PRODUCT_IDS = [
  'forms',
  'whatsappApi',
  'whatsapp',
  'instagram',
  'messenger',
  'emailApi',
] as const;

export type DeveloperProductId = (typeof DEVELOPER_PRODUCT_IDS)[number];

export type DeveloperProductStatus = 'available' | 'coming_soon';

export const DEVELOPER_PRODUCT_CATALOG: Record<
  DeveloperProductId,
  { status: DeveloperProductStatus }
> = {
  forms: { status: 'available' },
  whatsappApi: { status: 'available' },
  whatsapp: { status: 'available' },
  instagram: { status: 'coming_soon' },
  messenger: { status: 'coming_soon' },
  emailApi: { status: 'coming_soon' },
};

const PRODUCT_ID_PATTERN = /^[a-z][a-zA-Z0-9]*$/;

export function isDeveloperProductId(value: string): value is DeveloperProductId {
  return (
    PRODUCT_ID_PATTERN.test(value) &&
    Object.prototype.hasOwnProperty.call(DEVELOPER_PRODUCT_CATALOG, value)
  );
}

export function isInstallableProductId(
  value: string,
): value is DeveloperProductId {
  return (
    isDeveloperProductId(value) &&
    DEVELOPER_PRODUCT_CATALOG[value].status === 'available'
  );
}
