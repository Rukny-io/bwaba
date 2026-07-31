"use client";

import React, { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, Loader2 } from "lucide-react";
import { uploadAvatar } from "@/lib/manage/api";

interface HeroAvatarUploadProps {
  onUploaded: (key: string) => void | Promise<void>;
}

export function HeroAvatarUpload({ onUploaded }: HeroAvatarUploadProps) {
  const t = useTranslations("Manage");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;

    setUploading(true);
    try {
      const { key } = await uploadAvatar(file);
      await onUploaded(key);
    } catch {
      // Parent refresh restores previous state
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-0.5 -end-0.5 flex size-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        aria-label={t("personal_info.avatar_change")}
      >
        {uploading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Camera className="size-3.5" />
        )}
      </button>
    </>
  );
}
