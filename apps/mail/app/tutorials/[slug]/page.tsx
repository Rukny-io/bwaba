import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MailTutorialArticlePage } from "@/components/marketing/mail-tutorial-article-page";
import { MailMarketingShell } from "@/components/marketing/mail-marketing-shell";
import { getMailTutorialArticle, MAIL_TUTORIAL_ARTICLES } from "@/lib/mail-tutorials";
import { getCurrentMailUser } from "@/lib/current-user";

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
    return { title: "Tutorial — Rukny Mail" };
  }
  return {
    title: `${article.title} — Rukny Mail Tutorials`,
    description: article.summary,
  };
}

export default async function TutorialArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getMailTutorialArticle(slug);
  if (!article) notFound();

  const user = await getCurrentMailUser();
  return (
    <MailMarketingShell signedIn={Boolean(user)} plainBackground>
      <MailTutorialArticlePage article={article} />
    </MailMarketingShell>
  );
}
