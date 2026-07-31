"use client";

import React, { useRef } from "react";
import { useTranslations } from "next-intl";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_FILES = 3;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

export function SupportAttachmentInput({
  files,
  onChange,
  disabled,
  className,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("Manage.support");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    for (const file of Array.from(list)) {
      if (next.length >= MAX_FILES) break;
      if (!ALLOWED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_SIZE) continue;
      next.push(file);
    }
    onChange(next.slice(0, MAX_FILES));
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || files.length >= MAX_FILES}
          onClick={() => inputRef.current?.click()}
          className="gap-2"
        >
          <Paperclip className="size-4" />
          {t("attach_files")}
        </Button>
        <span className="text-xs text-muted-foreground">
          {t("attach_hint", { count: files.length, max: MAX_FILES })}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(e) => {
          handleSelect(e.target.files);
          e.target.value = "";
        }}
      />

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-secondary/40 px-3.5 py-2.5 text-sm"
            >
              <span className="truncate font-medium text-foreground">{file.name}</span>
              <button
                type="button"
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                disabled={disabled}
                onClick={() =>
                  onChange(files.filter((_, fileIndex) => fileIndex !== index))
                }
                aria-label={t("attach_remove", { name: file.name })}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export async function uploadSupportAttachments(
  ticketId: string,
  files: File[],
  messageId?: string,
  uploadFn?: (
    ticketId: string,
    file: File,
    messageId?: string,
  ) => Promise<unknown>,
) {
  const { uploadSupportAttachment } = await import("@/lib/manage/api");
  const uploader = uploadFn ?? uploadSupportAttachment;

  for (const file of files) {
    await uploader(ticketId, file, messageId);
  }
}
