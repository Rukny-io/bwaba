import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TutorialSlugRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/documents/${slug}`);
}
