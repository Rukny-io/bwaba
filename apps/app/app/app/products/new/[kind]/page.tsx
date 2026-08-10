import { notFound } from 'next/navigation';
import { ProductCreateCanvas } from '@/components/products/create/page/product-create-canvas';
import { parseProductKindParam } from '@/lib/products/paths';

interface CreateProductKindPageProps {
  params: Promise<{ kind: string }>;
}

export default async function CreateProductKindPage({
  params,
}: CreateProductKindPageProps) {
  const { kind: kindSlug } = await params;
  const kind = parseProductKindParam(kindSlug);

  if (!kind) {
    notFound();
  }

  return <ProductCreateCanvas kind={kind} />;
}
