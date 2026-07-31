"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, ExternalLink, Eye, Share2 } from "lucide-react";
import { ManageGroup, ManageListItem } from "./manage-ui";
import { ProfilePreviewModal } from "./profile-preview-modal";

interface ProfilePublicSectionProps {
  publicProfileUrl: string;
  name: string;
  username?: string | null;
  bio?: string | null;
  avatar?: string | null;
  verified?: boolean;
}

export function ProfilePublicSection({
  publicProfileUrl,
  name,
  username,
  bio,
  avatar,
  verified,
}: ProfilePublicSectionProps) {
  const t = useTranslations("Manage");
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: t("personal_info.share_text", { name }),
          url: publicProfileUrl,
        });
        return;
      } catch {
        /* user cancelled or unsupported */
      }
    }
    await copyLink();
  };

  return (
    <>
      <ManageGroup>
        <ManageListItem
          icon={Eye}
          tone="blue"
          title={t("personal_info.preview_profile")}
          subtitle={t("personal_info.preview_desc")}
          onClick={() => setPreviewOpen(true)}
        />
        <ManageListItem
          icon={ExternalLink}
          tone="teal"
          title={t("personal_info.public_profile")}
          subtitle={publicProfileUrl}
          href={publicProfileUrl}
          trailing={
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void shareLink();
                }}
                className="flex size-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-muted/60"
                aria-label={t("personal_info.share_link")}
              >
                <Share2 className="size-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void copyLink();
                }}
                className="flex size-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-muted/60"
                aria-label={t("personal_info.copy_link")}
              >
                {copied ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
            </div>
          }
        />
      </ManageGroup>

      <ProfilePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        name={name}
        username={username}
        bio={bio}
        avatar={avatar}
        verified={verified}
      />
    </>
  );
}
