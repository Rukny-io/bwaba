import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MailDocumentArticlePage } from "@/components/documents/mail-document-article-page";
import { getMailTutorialArticle, MAIL_TUTORIAL_ARTICLES } from "@/lib/mail-tutorials";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return MAIL_TUTORIAL_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getMailTutorialArticle(slug);
  if (!article) {
    return { title: "Document — Rukny Mail" };
  }
  return {
    title: `${article.title} — Rukny Mail Documents`,
    description: article.summary,
  };
}

export default async function DocumentArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getMailTutorialArticle(slug);
  if (!article) notFound();
  return <MailDocumentArticlePage article={article} />;
}
