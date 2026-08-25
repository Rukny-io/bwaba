export type ProductKind = 'PHYSICAL' | 'DIGITAL' | 'SERVICE';

export type ProductStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'OUT_OF_STOCK'
  | 'DISCONTINUED';

export interface StoreProduct {
  id: string;
  name: string;
  nameAr?: string | null;
  slug: string;
  description?: string | null;
  descriptionAr?: string | null;
  price: number | string;
  salePrice?: number | string | null;
  quantity: number;
  status: ProductStatus;
  productKind: ProductKind;
  isDigital: boolean;
  hasVariants?: boolean;
  trackInventory?: boolean;
  currency?: string;
  sku?: string | null;
  categoryId?: string | null;
  product_categories?: {
    id: string;
    name: string;
    nameAr?: string | null;
  } | null;
  product_images?: Array<{
    id?: string;
    imagePath: string;
    isPrimary?: boolean;
    displayOrder?: number;
  }>;
  productAttributes?: Array<{
    key: string;
    value: string;
    valueAr?: string | null;
  }>;
  digitalAssets?: Array<{
    id: string;
    fileName: string;
    fileSize?: number | string;
    mimeType?: string;
  }>;
  variants?: Array<{
    id: string;
    sku?: string | null;
    price: number | string;
    stock: number;
    attributes?: Record<string, string> | null;
  }>;
  _count?: {
    order_items?: number;
    reviews?: number;
    variants?: number;
    digitalAssets?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductInput {
  kind: ProductKind;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  salePrice?: number;
  quantity?: number;
  sku?: string;
  status?: ProductStatus;
  currency?: string;
  serviceType?: string;
  serviceDuration?: string;
  deliveryMethod?: string;
  templateValues?: Record<string, string | string[] | boolean>;
  variants?: Array<{
    attributes: Record<string, string>;
    stock: number;
  }>;
  hasVariants?: boolean;
}

export const PRODUCT_KIND_LABELS: Record<
  ProductKind,
  { title: string; description: string }
> = {
  PHYSICAL: {
    title: 'مادي',
    description: 'منتجات ملموسة مع صور ووصف ومخزون.',
  },
  DIGITAL: {
    title: 'رقمي',
    description: 'ملفات، دورات، أو محتوى يُسلّم بعد الشراء.',
  },
  SERVICE: {
    title: 'خدمة',
    description: 'استشارات، مواعيد، أو خدمات بدون مخزون.',
  },
};

export const SERVICE_TYPE_OPTIONS = [
  { value: 'consultation', label: 'استشارة' },
  { value: 'appointment', label: 'موعد / حجز' },
  { value: 'delivery', label: 'خدمة توصيل' },
  { value: 'custom', label: 'خدمة مخصصة' },
] as const;

export const DELIVERY_METHOD_OPTIONS = [
  { value: 'online', label: 'أونلاين' },
  { value: 'in_person', label: 'حضوري' },
  { value: 'hybrid', label: 'مختلط' },
] as const;
