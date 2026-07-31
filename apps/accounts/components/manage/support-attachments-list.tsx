import type { SupportTicketAttachment } from "@/lib/manage/types";
import { isImageAttachment, isPdfAttachment } from "@/lib/support-attachment-utils";
import { cn } from "@/lib/utils";

export function SupportAttachmentsList({
  attachments,
  className,
  imageClassName,
}: {
  attachments: SupportTicketAttachment[];
  className?: string;
  imageClassName?: string;
}) {
  if (!attachments.length) return null;

  return (
    <ul className={cn("mt-2 space-y-2", className)}>
      {attachments.map((file) => (
        <li key={file.id}>
          {isImageAttachment(file) ? (
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-lg border border-border/60"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.url}
                alt={file.fileName}
                className={cn(
                  "max-h-48 w-full object-cover transition-opacity hover:opacity-90",
                  imageClassName,
                )}
              />
              <span className="block truncate px-2 py-1 text-[11px] text-muted-foreground">
                {file.fileName}
              </span>
            </a>
          ) : (
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              {isPdfAttachment(file) ? "PDF · " : ""}
              {file.fileName}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
