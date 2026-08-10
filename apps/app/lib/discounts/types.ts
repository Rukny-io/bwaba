export interface ProductDiscount {
  id: string;
  storeId: string;
  percentage: number;
  isActive: boolean;
  productsCount: number;
  productIds: string[];
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDiscountInput {
  percentage: number;
  productIds: string[];
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProductDiscountInput extends Partial<CreateProductDiscountInput> {}
