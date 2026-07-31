"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ManageAvatar } from "./manage-ui";
import { HeroAvatarUpload } from "./hero-avatar-upload";
import { VerifiedDisplayName } from "./verified-badge";

interface ProfileHeroProps {
  avatar?: string | null;
  name: string;
  username?: string | null;
  initials: string;
  verified?: boolean;
  onAvatarUploaded: (key: string) => void | Promise<void>;
}

export function ProfileHero({
  avatar,
  name,
  username,
  initials,
  verified = false,
  onAvatarUploaded,
}: ProfileHeroProps) {
  const t = useTranslations("Manage");

  return (
    <div className="overflow-hidden rounded-[20px] border border-border/40 bg-card px-4 pb-4 pt-5">
      <div className="flex flex-col items-center text-center">
        <div className="relative shrink-0 rounded-full ring-4 ring-card">
          <ManageAvatar
            avatar={avatar}
            initials={initials}
            alt={name}
            size="profile"
            className="h-[80px] w-[80px]"
          />
          <HeroAvatarUpload onUploaded={onAvatarUploaded} />
        </div>

        <h2 className="mt-3 text-xl font-normal leading-tight text-foreground">
          <VerifiedDisplayName name={name} verified={verified} badgeSize={18} />
        </h2>
        {username ? (
          <p className="mt-0.5 text-sm text-muted-foreground" dir="ltr">
            @{username}
          </p>
        ) : (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("personal_info.username_missing")}
          </p>
        )}
      </div>
    </div>
  );
}
