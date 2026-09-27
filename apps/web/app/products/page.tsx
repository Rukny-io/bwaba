import { redirect } from 'next/navigation';

/** /products → قسم المنتجات في الصفحة الرئيسية */
export default function ProductsIndexPage() {
  redirect('/#products');
}
