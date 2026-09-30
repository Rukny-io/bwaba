export interface PublicSocialLink {
  id: string;
  platform: string;
  username: string | null;
  url: string;
  title: string | null;
  displayOrder: number;
  layout?: string;
  thumbnail?: string | null;
  connectionId?: string | null;
  totalClicks?: number;
}

export interface PublicProfile {
  id?: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  coverImage: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
  themeKey?: string | null;
  isRuknyVerified?: boolean;
  /** Public contact email when hideEmail is false */
  email?: string | null;
  /** Public phone when hidePhone is false */
  phone?: string | null;
  hideEmail?: boolean;
  hidePhone?: boolean;
  user?: {
    email?: string | null;
    phone?: string | null;
    phoneNumber?: string | null;
  } | null;
  socialLinks: PublicSocialLink[];
  _count?: {
    followers?: number;
    following?: number;
  };
}

export interface PublicProfileForm {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  type: string;
  coverImage: string | null;
  _count?: { submissions: number };
}

export interface PublicProfileProductAttribute {
  key: string;
  value: string;
}

export interface PublicProfileProductVariant {
  id: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  attributes: Record<string, unknown> | null;
  imageUrl: string | null;
}

export interface PublicProfileProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  currency: string;
  stock: number;
  isDigital: boolean;
  images: string[];
  sku?: string | null;
  category?: string | null;
  attributes?: PublicProfileProductAttribute[];
  hasVariants?: boolean;
  variants?: PublicProfileProductVariant[];
}

export interface PublicProfileProductsResponse {
  products: PublicProfileProduct[];
  total: number;
  storeId: string | null;
}

export interface PublicProfileCollection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imagePath?: string | null;
  bannerPath?: string | null;
  productsCount: number;
  productIds: string[];
}

export type MediaUrlResolver = (path: string | null | undefined) => string | null;
