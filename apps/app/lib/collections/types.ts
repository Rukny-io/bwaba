export interface ProductCollection {
  id: string;
  storeId: string;
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  imagePath?: string;
  bannerPath?: string;
  order: number;
  isActive: boolean;
  productsCount: number;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductCollectionInput {
  name?: string;
  nameAr?: string;
  slug?: string;
  description?: string;
  imagePath?: string;
  bannerPath?: string;
  isActive?: boolean;
  productIds?: string[];
}

export interface UpdateProductCollectionInput extends CreateProductCollectionInput {}

export interface MyStoreProduct {
  id: string;
  name: string;
  nameAr?: string | null;
  price: number | string;
  status: string;
  product_images?: Array<{
    imagePath: string;
    isPrimary?: boolean;
    displayOrder?: number;
  }>;
}
