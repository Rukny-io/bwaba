export type TemplateFieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'boolean'
  | 'textarea';

export interface TemplateField {
  key: string;
  label: string;
  labelAr: string;
  type: TemplateFieldType;
  options?: string[];
  required: boolean;
  placeholder?: string;
  /** إن وُجد: يظهر الحقل فقط لهذه الأنواع */
  kinds?: Array<'PHYSICAL' | 'DIGITAL' | 'SERVICE'>;
}

export interface VariantAttribute {
  key: string;
  label: string;
  labelAr: string;
  options: string[];
}

export interface CategoryKindRules {
  attributeKeys?: string[];
  enableVariants?: boolean;
}

export interface CategoryTemplateFields {
  hasVariants: boolean;
  variantAttributes?: VariantAttribute[];
  productAttributes: TemplateField[];
  /** قواعد اختيارية لكل نوع منتج (من قاعدة البيانات) */
  kindRules?: Partial<
    Record<'PHYSICAL' | 'DIGITAL' | 'SERVICE', CategoryKindRules>
  >;
}

export interface StoreProductTemplateResponse {
  storeId: string | null;
  categoryId: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  categoryNameAr: string | null;
  template: CategoryTemplateFields | null;
}

export type TemplateFieldValue = string | string[] | boolean;

export interface ProductVariantDraft {
  id: string;
  attributes: Record<string, string>;
  stock: number;
}
