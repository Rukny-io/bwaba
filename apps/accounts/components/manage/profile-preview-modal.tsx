"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ManageAvatar } from "./manage-ui";
import { VerifiedDisplayName } from "./verified-badge";

interface ProfilePreviewModalProps {
  open: boolean;
  onClose: () => void;
  name: string;
  username?: string | null;
  bio?: string | null;
  avatar?: string | null;
  verified?: boolean;
}

export function ProfilePreviewModal({
  open,
  onClose,
  name,
  username,
  bio,
  avatar,
  verified = false,
}: ProfilePreviewModalProps) {
  const t = useTranslations("Manage");
  const initials = name.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("personal_info.preview_title")}
    >
      <div
        className={cn(
          "w-full max-w-sm overflow-hidden rounded-[20px] border border-border/40 bg-card shadow-lg",
          "animate-in fade-in slide-in-from-bottom-4 duration-200 sm:slide-in-from-bottom-0",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <p className="text-sm font-medium text-foreground">
            {t("personal_info.preview_title")}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60"
            aria-label={t("cancel")}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col items-center px-4 pb-5 pt-5 text-center">
          <ManageAvatar
            avatar={avatar}
            initials={initials}
            alt={name}
            size="profile"
            className="h-16 w-16"
          />

          <h3 className="mt-3 text-lg font-normal text-foreground">
            <VerifiedDisplayName name={name} verified={verified} badgeSize={16} />
          </h3>
          {username && (
            <p className="mt-0.5 text-sm text-muted-foreground" dir="ltr">
              @{username}
            </p>
          )}
          {bio ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {bio}
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("personal_info.bio_empty")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
