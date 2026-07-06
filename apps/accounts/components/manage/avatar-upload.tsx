"use client";

import React, { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadAvatar } from "@/lib/manage/api";
import { resolveMediaUrl } from "@/lib/media-url";
import { ui } from "./manage-ui";

interface AvatarUploadProps {
  currentUrl?: string | null;
  fallbackInitial: string;
  onUploaded: (key: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export function AvatarUpload({
  currentUrl,
  fallbackInitial,
  onUploaded,
  className,
  size = "md",
}: AvatarUploadProps) {
  const t = useTranslations("Manage");
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    resolveMediaUrl(currentUrl) ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dim = size === "sm" ? "size-16" : "size-20";

  useEffect(() => {
    setPreview(resolveMediaUrl(currentUrl) ?? null);
  }, [currentUrl]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(t("avatar.invalid_type"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t("avatar.too_large"));
      return;
    }

    setUploading(true);
    setError(null);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const { key } = await uploadAvatar(file);
      onUploaded(key);
      setPreview(resolveMediaUrl(key));
    } catch {
      setError(t("avatar.upload_error"));
      setPreview(resolveMediaUrl(currentUrl) ?? null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
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
        className={cn(
          "group relative shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-border/80 transition-opacity hover:opacity-90 disabled:opacity-50",
          dim,
        )}
      >
        {preview ? (
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-xl font-normal">
            {fallbackInitial}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/20 opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-background" />
          ) : (
            <Camera className="size-5 text-background" />
          )}
        </div>
      </button>
      <p className="mt-2 text-xs text-muted-foreground">{t("avatar.hint")}</p>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
