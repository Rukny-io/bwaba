"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { submitRuknyVerifiedApplication } from "@/lib/manage/api";
import type { RuknyVerifiedCategory } from "@/lib/manage/types";
import { cn } from "@/lib/utils";
import { ManageGroup, ManageSuccessBanner, ui } from "./manage-ui";

const CATEGORIES: RuknyVerifiedCategory[] = ["personal", "business", "creator"];

interface VerifiedApplyFormProps {
  defaultDisplayName?: string;
  onSuccess: () => void;
}

export function VerifiedApplyForm({ defaultDisplayName = "", onSuccess }: VerifiedApplyFormProps) {
  const t = useTranslations("Manage.verified.apply_form");

  const [category, setCategory] = useState<RuknyVerifiedCategory>("personal");
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [publicBio, setPublicBio] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      const socialLinks = {
        ...(instagram.trim() && { instagram: instagram.trim() }),
        ...(tiktok.trim() && { tiktok: tiktok.trim() }),
        ...(linkedin.trim() && { linkedin: linkedin.trim() }),
        ...(websiteUrl.trim() && { website: websiteUrl.trim() }),
      };

      await submitRuknyVerifiedApplication({
        category,
        displayName: displayName.trim(),
        publicBio: publicBio.trim(),
        websiteUrl: websiteUrl.trim() || undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      });

      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError(
        (err as Error & { data?: { message?: string } }).data?.message ||
          t("submit_error"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && <ManageSuccessBanner>{t("submit_success")}</ManageSuccessBanner>}

      <ManageGroup className="divide-y divide-border/60">
        <div className={cn("space-y-3 px-4 py-4", ui.divider)}>
          <div>
            <p className="text-sm font-medium">{t("category_label")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("category_hint")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  category === value
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50",
                )}
              >
                {t(`category_${value}`)}
              </button>
            ))}
          </div>
        </div>

        <div className={cn("space-y-2 px-4 py-4", ui.divider)}>
          <label htmlFor="verified-display-name" className="text-sm font-medium">
            {t("display_name_label")}
          </label>
          <Input
            id="verified-display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("display_name_placeholder")}
            required
            minLength={2}
            maxLength={80}
          />
          <p className="text-xs text-muted-foreground">{t("display_name_hint")}</p>
        </div>

        <div className={cn("space-y-2 px-4 py-4", ui.divider)}>
          <label htmlFor="verified-public-bio" className="text-sm font-medium">
            {t("public_bio_label")}
          </label>
          <Textarea
            id="verified-public-bio"
            value={publicBio}
            onChange={(e) => setPublicBio(e.target.value)}
            placeholder={t("public_bio_placeholder")}
            required
            minLength={20}
            maxLength={500}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">{t("public_bio_hint")}</p>
        </div>

        <div className={cn("space-y-2 px-4 py-4", ui.divider)}>
          <label htmlFor="verified-website" className="text-sm font-medium">
            {t("website_label")}
          </label>
          <Input
            id="verified-website"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder={t("website_placeholder")}
          />
        </div>

        <div className={cn("space-y-3 px-4 py-4", ui.divider)}>
          <p className="text-sm font-medium">{t("social_label")}</p>
          <Input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder={t("instagram_placeholder")}
          />
          <Input
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            placeholder={t("tiktok_placeholder")}
          />
          <Input
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder={t("linkedin_placeholder")}
          />
        </div>
      </ManageGroup>

      <Button
        type="submit"
        disabled={submitting || success}
        className="w-fit rounded-full"
      >
        {submitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
