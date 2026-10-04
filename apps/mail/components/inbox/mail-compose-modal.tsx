"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Code,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Paperclip,
  Quote,
  Redo2,
  RemoveFormatting,
  Send,
  Signature,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  SquareCode,
} from "lucide-react";
import {
  Button,
  Input,
  Label,
  Modal,
  TextArea,
  TextField,
  Toolbar,
  useMediaQuery,
} from "@heroui/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { MailPersonAvatar } from "@/components/inbox/mail-person-avatar";
import { fetchMailOutboundUsage } from "@/lib/mail-usage-client";
import {
  saveMailDraft,
  updateMailDraft,
  uploadMailAttachment,
  type MailAttachmentView,
} from "@/lib/mail-messages-client";

export type ComposeDraft = {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  replyToMessageId?: string;
  draftId?: string;
  attachmentIds?: string[];
  attachments?: MailAttachmentView[];
  scheduledAt?: string;
};

type Props = {
  open: boolean;
  appId?: string | null;
  mailboxId?: string | null;
  fromAddress: string | null;
  fromAvatarUrl?: string | null;
  fromDisplayName?: string | null;
  initial?: ComposeDraft | null;
  sending?: boolean;
  error?: string;
  onClose: () => void;
  onSend: (draft: ComposeDraft) => void | Promise<void>;
};

function parseRecipients(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function plainTextToHtml(value: string) {
  const escaped = value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replaceAll("\n", "<br>")}</p>`)
    .join("");
}

async function imageFileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image must be smaller than 8 MB.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not process this image.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let quality = 0.82;
  let blob: Blob | null = null;
  do {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    quality -= 0.12;
  } while (blob && blob.size > 220 * 1024 && quality >= 0.34);

  if (!blob || blob.size > 220 * 1024) {
    throw new Error("Image is too detailed. Choose a smaller image.");
  }

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.readAsDataURL(blob);
  });
}

export function MailComposeModal({
  open,
  appId = null,
  mailboxId = null,
  fromAddress,
  fromAvatarUrl = null,
  fromDisplayName = null,
  initial,
  sending = false,
  error = "",
  onClose,
  onSend,
}: Props) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCopies, setShowCopies] = useState(false);
  const [subject, setSubject] = useState("");
  const [localError, setLocalError] = useState("");
  const [signature, setSignature] = useState("");
  const [showSignatureEditor, setShowSignatureEditor] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [usageHint, setUsageHint] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<MailAttachmentView[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [editorRevision, setEditorRevision] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "my-3 h-auto max-w-full rounded-xl",
        },
      }),
      Link.configure({
        autolink: true,
        openOnClick: false,
        defaultProtocol: "https",
      }),
      Placeholder.configure({
        placeholder: "Write your message…",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] px-4 py-4 text-[15px] leading-relaxed text-[var(--foreground)] outline-none sm:min-h-[280px] sm:px-5 [&_a]:text-[var(--primary)] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--border)] [&_blockquote]:pl-3 [&_blockquote]:text-[var(--muted-foreground)] [&_code]:rounded [&_code]:bg-[var(--surface-secondary)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_ol]:list-decimal [&_ol]:pl-6 [&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-[var(--muted-foreground)] [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[var(--surface-secondary)] [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc [&_ul]:pl-6",
      },
    },
    onTransaction: () => setEditorRevision((value) => value + 1),
    onSelectionUpdate: () => setEditorRevision((value) => value + 1),
  });

  useEffect(() => {
    if (!open || !editor) return;
    const frame = window.requestAnimationFrame(() => {
      setTo(initial?.to ?? "");
      setCc(initial?.cc ?? "");
      setBcc(initial?.bcc ?? "");
      setShowCopies(Boolean(initial?.cc || initial?.bcc));
      setSubject(initial?.subject ?? "");
      setSignature(
        window.localStorage.getItem(
          `rukny_mail_signature_${fromAddress ?? "default"}`,
        ) ?? "",
      );
      setShowSignatureEditor(false);
      setDraftId(initial?.draftId ?? null);
      setScheduledAt(initial?.scheduledAt?.slice(0, 16) ?? "");
      setAttachments(initial?.attachments ?? []);
      setLinkOpen(false);
      setLinkUrl("");
      editor.commands.setContent(
        initial?.bodyHtml ?? plainTextToHtml(initial?.body ?? ""),
      );
      setLocalError("");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editor, fromAddress, initial, open]);

  useEffect(() => {
    if (!open) {
      setUsageHint(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { usage } = await fetchMailOutboundUsage();
        if (cancelled || !usage) return;
        if (usage.remaining <= 0) {
          setUsageHint(
            "Outbound quota reached. Buy email packs in Billing → Usage to send.",
          );
        } else if (usage.percentUsed >= 80) {
          setUsageHint(
            `${usage.remaining.toLocaleString("en-IQ")} outbound emails remaining this period.`,
          );
        } else {
          setUsageHint(null);
        }
      } catch {
        if (!cancelled) setUsageHint(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const recipients = parseRecipients(to);
    if (recipients.length === 0) {
      setLocalError("Add at least one recipient.");
      return;
    }
    if (!subject.trim()) {
      setLocalError("Subject is required.");
      return;
    }
    if (!editor || editor.isEmpty) {
      setLocalError("Message body is required.");
      return;
    }
    const body = editor.getText({ blockSeparator: "\n" }).trim();
    setLocalError("");
    await onSend({
      to: recipients.join(", "),
      cc: cc.trim() || undefined,
      bcc: bcc.trim() || undefined,
      subject: subject.trim(),
      body,
      bodyHtml: editor.getHTML(),
      replyToMessageId: initial?.replyToMessageId,
      draftId: draftId ?? undefined,
      attachmentIds: attachments.map((item) => item.id),
      scheduledAt: scheduledAt
        ? new Date(scheduledAt).toISOString()
        : undefined,
    });
  }

  async function persistDraft() {
    const resolvedMailboxId = mailboxId;
    if (!appId || !resolvedMailboxId || !isValidMailboxId(resolvedMailboxId) || !editor) {
      return;
    }
    setSavingDraft(true);
    try {
      const payload = {
        mailboxId: resolvedMailboxId,
        to: parseRecipients(to),
        cc: parseRecipients(cc),
        bcc: parseRecipients(bcc),
        subject: subject.trim(),
        bodyText: editor.getText({ blockSeparator: "\n" }).trim(),
        bodyHtml: editor.getHTML(),
        replyToMessageId: initial?.replyToMessageId,
        attachmentIds: attachments.map((item) => item.id),
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      };
      const saved = draftId
        ? await updateMailDraft(appId, draftId, payload)
        : await saveMailDraft(appId, payload);
      setDraftId(saved.id);
    } catch (draftError) {
      setLocalError(
        draftError instanceof Error
          ? draftError.message
          : "Could not save draft.",
      );
    } finally {
      setSavingDraft(false);
    }
  }

  useEffect(() => {
    if (!open || !appId || !isValidMailboxId(mailboxId)) return;
    const handle = window.setTimeout(() => {
      void persistDraft();
    }, 2000);
    return () => window.clearTimeout(handle);
  }, [
    open,
    appId,
    mailboxId,
    to,
    cc,
    bcc,
    subject,
    attachments,
    scheduledAt,
    editorRevision,
  ]);

  function applyLink() {
    if (!editor) return;
    const href = linkUrl.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href })
        .run();
    }
    setLinkOpen(false);
  }

  async function onAttachmentSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !appId || !mailboxId) return;
    setLocalError("");
    try {
      const uploaded = await uploadMailAttachment(
        appId,
        mailboxId,
        file,
        draftId ?? undefined,
      );
      setAttachments((prev) => [...prev, uploaded]);
    } catch (uploadError) {
      setLocalError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload attachment.",
      );
    }
  }

  async function onImageSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor || processingImage) return;
    setProcessingImage(true);
    setLocalError("");
    try {
      const src = await imageFileToDataUrl(file);
      editor.chain().focus().setImage({ src, alt: file.name }).run();
    } catch (uploadError) {
      setLocalError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not add this image.",
      );
    } finally {
      setProcessingImage(false);
    }
  }

  function saveAndInsertSignature() {
    const value = signature.trim();
    if (!editor || !value) {
      setLocalError("Write your signature first.");
      return;
    }
    window.localStorage.setItem(
      `rukny_mail_signature_${fromAddress ?? "default"}`,
      value,
    );
    editor
      .chain()
      .focus()
      .insertContent(`<hr>${plainTextToHtml(value)}`)
      .run();
    setShowSignatureEditor(false);
    setLocalError("");
  }

  const composeTitle = initial?.replyToMessageId ? "Reply" : "New message";

  const toolButton =
    "size-7 min-w-7 shrink-0 rounded-md transition-colors";
  const toolActive = "bg-[var(--foreground)]/8 text-[var(--foreground)]";

  function isValidMailboxId(value: string | null | undefined) {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  function ToolbarDivider() {
    return (
      <span
        className="mx-1 h-4 w-px shrink-0 bg-[var(--border)]"
        aria-hidden
      />
    );
  }

  const composeForm = (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className={
        isMobile
          ? "flex h-full min-h-0 w-full flex-col"
          : "flex max-h-[min(94dvh,720px)] min-h-0 w-full flex-col"
      }
    >
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void onImageSelected(event)}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(event) => void onAttachmentSelected(event)}
      />

      <div
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4 sm:gap-3.5 sm:p-5 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-5"
      >
        <div className="flex shrink-0 items-center gap-3">
          {fromAddress ? (
            <MailPersonAvatar
              name={fromDisplayName || fromAddress}
              email={fromAddress}
              avatarUrl={fromAvatarUrl}
              className="size-11 shrink-0"
            />
          ) : (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
              <Send className="size-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold leading-snug tracking-tight text-[var(--foreground)]">
              {composeTitle}
            </h2>
            {fromAddress ? (
              <p dir="ltr" className="truncate text-[12px] text-[var(--muted-foreground)]">
                {fromAddress}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            isIconOnly
            size="sm"
            variant="tertiary"
            aria-label="Close"
            isDisabled={sending}
            onPress={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        {(scheduledAt || draftId || attachments.length > 0 || usageHint) ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {draftId ? (
              <span className="rounded-full bg-[var(--surface-secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--foreground)]">
                Draft saved
              </span>
            ) : null}
            {scheduledAt ? (
              <span className="rounded-full bg-[var(--surface-secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--foreground)]">
                Scheduled
              </span>
            ) : null}
            {attachments.length > 0 ? (
              <span className="rounded-full bg-[var(--surface-secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--foreground)]">
                {attachments.length} attachment{attachments.length === 1 ? "" : "s"}
              </span>
            ) : null}
            {usageHint ? (
              <span className="text-[10px] leading-snug text-amber-700 dark:text-amber-400">
                {usageHint}
              </span>
            ) : null}
          </div>
        ) : null}

          <div className="flex flex-col gap-2">
            <div className="flex min-h-10 items-center gap-2 rounded-xl bg-[var(--surface-secondary)]/60 px-3">
              <Label className="w-10 shrink-0 text-[11px] font-medium text-[var(--muted-foreground)]">
                To
              </Label>
              <TextField className="min-w-0 flex-1">
                <Input
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="h-9 border-0 bg-transparent px-0 text-[13px] shadow-none focus:ring-0"
                />
              </TextField>
              {!showCopies ? (
                <Button
                  type="button"
                  size="sm"
                  variant="tertiary"
                  onPress={() => setShowCopies(true)}
                >
                  Cc/Bcc
                </Button>
              ) : null}
            </div>

            {showCopies ? (
              <>
                <div className="flex min-h-10 items-center gap-2 rounded-xl bg-[var(--surface-secondary)]/60 px-3">
                  <Label className="w-10 shrink-0 text-[11px] font-medium text-[var(--muted-foreground)]">
                    Cc
                  </Label>
                  <TextField className="min-w-0 flex-1">
                    <Input
                      value={cc}
                      onChange={(event) => setCc(event.target.value)}
                      placeholder="Optional"
                      className="h-9 border-0 bg-transparent px-0 text-[13px] shadow-none focus:ring-0"
                    />
                  </TextField>
                </div>
                <div className="flex min-h-10 items-center gap-2 rounded-xl bg-[var(--surface-secondary)]/60 px-3">
                  <Label className="w-10 shrink-0 text-[11px] font-medium text-[var(--muted-foreground)]">
                    Bcc
                  </Label>
                  <TextField className="min-w-0 flex-1">
                    <Input
                      value={bcc}
                      onChange={(event) => setBcc(event.target.value)}
                      placeholder="Optional"
                      className="h-9 border-0 bg-transparent px-0 text-[13px] shadow-none focus:ring-0"
                    />
                  </TextField>
                </div>
              </>
            ) : null}

            <div className="flex min-h-10 items-center gap-2 rounded-xl bg-[var(--surface-secondary)]/60 px-3">
              <Label className="w-10 shrink-0 text-[11px] font-medium text-[var(--muted-foreground)]">
                Subject
              </Label>
              <TextField className="min-w-0 flex-1">
                <Input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Subject"
                  className="h-9 border-0 bg-transparent px-0 text-[13px] shadow-none focus:ring-0"
                />
              </TextField>
            </div>
          </div>

          <div className="flex min-h-[200px] min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-[var(--surface-secondary)]/35 sm:min-h-[240px]">
            <Toolbar
              aria-label="Message formatting"
              className="flex w-full flex-wrap items-center gap-0.5 px-2.5 py-2 sm:px-3"
            >
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={`${toolButton} ${editor?.isActive("bold") ? toolActive : ""}`}
                    aria-label="Bold"
                    onPress={() => editor?.chain().focus().toggleBold().run()}
                  >
                    <Bold className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={`${toolButton} ${editor?.isActive("italic") ? toolActive : ""}`}
                    aria-label="Italic"
                    onPress={() => editor?.chain().focus().toggleItalic().run()}
                  >
                    <Italic className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={`${toolButton} ${editor?.isActive("underline") ? toolActive : ""}`}
                    aria-label="Underline"
                    onPress={() => editor?.chain().focus().toggleUnderline().run()}
                  >
                    <UnderlineIcon className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={`${toolButton} ${editor?.isActive("strike") ? toolActive : ""}`}
                    aria-label="Strikethrough"
                    onPress={() => editor?.chain().focus().toggleStrike().run()}
                  >
                    <Strikethrough className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={`${toolButton} ${editor?.isActive("code") ? toolActive : ""}`}
                    aria-label="Inline code"
                    onPress={() => editor?.chain().focus().toggleCode().run()}
                  >
                    <Code className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={`${toolButton} ${editor?.isActive("codeBlock") ? toolActive : ""}`}
                    aria-label="Code block"
                    onPress={() => editor?.chain().focus().toggleCodeBlock().run()}
                  >
                    <SquareCode className="size-4" />
                  </Button>
                  <ToolbarDivider />
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={`${toolButton} ${editor?.isActive({ textAlign: "left" }) ? toolActive : ""}`}
                    aria-label="Align left"
                    onPress={() => editor?.chain().focus().setTextAlign("left").run()}
                  >
                    <AlignLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={`${toolButton} ${editor?.isActive({ textAlign: "center" }) ? toolActive : ""}`}
                    aria-label="Align center"
                    onPress={() =>
                      editor?.chain().focus().setTextAlign("center").run()
                    }
                  >
                    <AlignCenter className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={`${toolButton} ${editor?.isActive({ textAlign: "right" }) ? toolActive : ""}`}
                    aria-label="Align right"
                    onPress={() =>
                      editor?.chain().focus().setTextAlign("right").run()
                    }
                  >
                    <AlignRight className="size-4" />
                  </Button>
                  <ToolbarDivider />
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={`${toolButton} ${editor?.isActive("bulletList") ? toolActive : ""}`}
                    aria-label="Bullet list"
                    onPress={() => editor?.chain().focus().toggleBulletList().run()}
                  >
                    <List className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={`${toolButton} ${editor?.isActive("orderedList") ? toolActive : ""}`}
                    aria-label="Numbered list"
                    onPress={() => editor?.chain().focus().toggleOrderedList().run()}
                  >
                    <ListOrdered className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={`${toolButton} ${editor?.isActive("blockquote") ? toolActive : ""}`}
                    aria-label="Quote"
                    onPress={() => editor?.chain().focus().toggleBlockquote().run()}
                  >
                    <Quote className="size-4" />
                  </Button>
                  <ToolbarDivider />
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={`${toolButton} ${editor?.isActive("link") || linkOpen ? toolActive : ""}`}
                    aria-label="Add link"
                    onPress={() => {
                      const current = editor?.getAttributes("link").href as
                        | string
                        | undefined;
                      setLinkUrl(current ?? "https://");
                      setLinkOpen((open) => !open);
                    }}
                  >
                    <LinkIcon className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={toolButton}
                    aria-label="Attach file"
                    onPress={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={toolButton}
                    aria-label="Insert divider"
                    onPress={() => editor?.chain().focus().setHorizontalRule().run()}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={toolButton}
                    aria-label="Insert image"
                    isPending={processingImage}
                    onPress={() => imageInputRef.current?.click()}
                  >
                    <ImageIcon className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={`${toolButton} ${showSignatureEditor ? toolActive : ""}`}
                    aria-label="Add signature"
                    onPress={() => setShowSignatureEditor((visible) => !visible)}
                  >
                    <Signature className="size-4" />
                  </Button>
                  <ToolbarDivider />
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={toolButton}
                    aria-label="Clear formatting"
                    onPress={() =>
                      editor?.chain().focus().clearNodes().unsetAllMarks().run()
                    }
                  >
                    <RemoveFormatting className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={toolButton}
                    aria-label="Undo"
                    isDisabled={!editor?.can().undo()}
                    onPress={() => editor?.chain().focus().undo().run()}
                  >
                    <Undo2 className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    className={toolButton}
                    aria-label="Redo"
                    isDisabled={!editor?.can().redo()}
                    onPress={() => editor?.chain().focus().redo().run()}
                  >
                    <Redo2 className="size-4" />
                  </Button>
            </Toolbar>
            {linkOpen ? (
              <div className="flex items-center gap-2 border-t border-[var(--separator)] px-3 py-2">
                      <LinkIcon className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                      <Input
                        value={linkUrl}
                        onChange={(event) => setLinkUrl(event.target.value)}
                        placeholder="https://example.com"
                        className="h-9 min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            applyLink();
                          }
                        }}
                      />
                      <Button type="button" size="sm" variant="secondary" onPress={applyLink}>
                        Apply
                      </Button>
              </div>
            ) : null}
            {attachments.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 border-t border-[var(--separator)] px-3 py-2">
                      {attachments.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[12px] text-[var(--foreground)]"
                        >
                          <Paperclip className="size-3 shrink-0 text-[var(--muted-foreground)]" />
                          <span className="truncate">{item.filename}</span>
                          <button
                            type="button"
                            className="rounded-md p-0.5 text-[var(--muted-foreground)] hover:bg-[var(--foreground)]/6 hover:text-[var(--foreground)]"
                            onClick={() =>
                              setAttachments((prev) =>
                                prev.filter((entry) => entry.id !== item.id),
                              )
                            }
                            aria-label={`Remove ${item.filename}`}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--surface)]">
              <EditorContent editor={editor} className="h-full" />
            </div>
          </div>

          {showSignatureEditor ? (
            <div className="shrink-0 rounded-xl bg-[var(--surface-secondary)]/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-[var(--foreground)]">
                    Email signature
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                    Saved on this device for {fromAddress}.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onPress={saveAndInsertSignature}
                >
                  Save & insert
                </Button>
              </div>
              <TextField className="mt-3">
                <Label className="sr-only">Email signature</Label>
                <TextArea
                  value={signature}
                  onChange={(event) => setSignature(event.target.value)}
                  rows={3}
                  placeholder={"Sara Al-Ahmad\nRukny\nsara@rukny.io"}
                />
              </TextField>
            </div>
          ) : null}

          {localError || error ? (
            <p className="text-[12px] text-[var(--danger)]" role="alert">
              {localError || error}
            </p>
          ) : null}

          <div className="flex flex-col gap-2.5 pt-1">
            <div className="flex items-stretch gap-2">
              <Button
                type="button"
                variant="secondary"
                isDisabled={
                  sending || savingDraft || !appId || !isValidMailboxId(mailboxId)
                }
                onPress={() => void persistDraft()}
                className="h-10 min-w-0 flex-1 rounded-xl text-[13px] font-medium !shadow-none"
              >
                {savingDraft ? "Saving…" : "Save draft"}
              </Button>
              <Button
                type="button"
                variant="tertiary"
                isDisabled={sending}
                onPress={onClose}
                className="h-10 rounded-xl text-[13px] !shadow-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isPending={sending}
                isDisabled={!fromAddress}
                className="h-10 min-w-0 flex-1 gap-1.5 rounded-xl text-[13px] font-medium !shadow-none"
              >
                {sending ? "Sending…" : "Send"}
                <Send className="size-3.5" />
              </Button>
            </div>
          </div>
      </div>
    </form>
  );

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !sending) onClose();
  };

  if (isMobile) {
    return (
      <Modal.Backdrop
        isOpen={open}
        isDismissable={!sending}
        onOpenChange={handleOpenChange}
        className="z-50"
      >
        <Modal.Container placement="center" scroll="inside" size="full">
          <Modal.Dialog className="overflow-hidden p-0">
            {composeForm}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    );
  }

  return (
    <Modal.Backdrop
      isOpen={open}
      isDismissable={!sending}
      onOpenChange={handleOpenChange}
      variant="blur"
      className="z-50"
    >
      <Modal.Container placement="center" scroll="inside" className="px-2 sm:px-3">
        <Modal.Dialog
          className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[var(--surface)] p-0 !shadow-none ring-0 outline-none"
        >
          {composeForm}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
