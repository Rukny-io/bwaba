"use client";

import React, { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadCover } from "@/lib/manage/api";
import { resolveMediaUrl } from "@/lib/media-url";

interface CoverUploadProps {
  currentUrl?: string | null;
  onUploaded: () => void | Promise<void>;
  className?: string;
}

export function CoverUpload({
  currentUrl,
  onUploaded,
  className,
}: CoverUploadProps) {
  const t = useTranslations("Manage");
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    resolveMediaUrl(currentUrl) ?? null,
  );
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPreview(resolveMediaUrl(currentUrl) ?? null);
  }, [currentUrl]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;

    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      await uploadCover(file);
      await onUploaded();
    } catch {
      setPreview(resolveMediaUrl(currentUrl) ?? null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
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
          "group absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors hover:bg-foreground/10",
          className,
        )}
        aria-label={t("personal_info.cover_change")}
      >
        {uploading ? (
          <Loader2 className="size-6 animate-spin text-background drop-shadow" />
        ) : (
          <div className="flex items-center gap-2 rounded-full bg-foreground/50 px-3 py-1.5 text-xs text-background opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <ImageIcon className="size-3.5" />
            <span>{preview ? t("personal_info.cover_change") : t("personal_info.cover_add")}</span>
          </div>
        )}
      </button>
    </>
  );
}
