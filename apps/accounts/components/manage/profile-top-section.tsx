"use client";

import React from "react";
import { ProfileHero } from "./profile-hero";

interface ProfileTopSectionProps {
  heroRef: React.RefObject<HTMLDivElement | null>;
  avatar?: string | null;
  name: string;
  username?: string | null;
  initials: string;
  verified?: boolean;
  onAvatarUploaded: (key: string) => void | Promise<void>;
}

export function ProfileTopSection({
  heroRef,
  avatar,
  name,
  username,
  initials,
  verified,
  onAvatarUploaded,
}: ProfileTopSectionProps) {
  return (
    <div ref={heroRef}>
      <ProfileHero
        avatar={avatar}
        name={name}
        username={username}
        initials={initials}
        verified={verified}
        onAvatarUploaded={onAvatarUploaded}
      />
    </div>
  );
}
