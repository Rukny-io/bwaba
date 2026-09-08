"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  Send,
  Signature,
  Underline as UnderlineIcon,
  Undo2,
  X,
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
import { MailPersonAvatar } from "@/components/inbox/mail-person-avatar";

export type ComposeDraft = {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  replyToMessageId?: string;
};

type Props = {
  open: boolean;
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
  const [, setEditorRevision] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);
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
    ],
    editorProps: {
      attributes: {
        class:
          "min-h-[260px] px-4 py-3 text-sm leading-7 text-[var(--foreground)] outline-none sm:min-h-[300px] [&_a]:text-[var(--primary)] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--border)] [&_blockquote]:pl-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-[var(--muted-foreground)] [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_ul]:list-disc [&_ul]:pl-6",
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
      editor.commands.setContent(
        initial?.bodyHtml ?? plainTextToHtml(initial?.body ?? ""),
      );
      setLocalError("");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editor, fromAddress, initial, open]);

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
    });
  }

  function setLink() {
    if (!editor) return;
    const current = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Link URL", current ?? "https://");
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: href.trim() })
      .run();
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

  const toolButton = "size-8 min-w-8";

  const composeForm = (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className={
        isMobile
          ? "flex h-full min-h-0 w-full flex-col"
          : "flex max-h-[min(94dvh,780px)] min-h-[620px] w-full flex-col"
      }
    >
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => void onImageSelected(event)}
            />
            <div className="flex w-full flex-row items-center justify-between gap-3 border-b border-[var(--border)]/70 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:py-3">
              <div className="flex min-w-0 items-center gap-3">
                {fromAddress ? (
                  <MailPersonAvatar
                    name={fromDisplayName || fromAddress}
                    email={fromAddress}
                    avatarUrl={fromAvatarUrl}
                    className="size-9"
                  />
                ) : null}
                <div className="min-w-0">
                  <h2 className="text-base font-medium text-[var(--foreground)]">
                    {initial?.replyToMessageId ? "Reply" : "New message"}
                  </h2>
                  {fromAddress ? (
                    <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
                      From {fromAddress}
                    </p>
                  ) : null}
                </div>
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

            <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
              <div className="shrink-0 divide-y divide-[var(--separator)] border-b border-[var(--separator)] px-4 sm:px-5">
                <div className="flex min-h-12 items-center gap-3">
                  <Label className="w-14 shrink-0 text-xs font-medium text-[var(--muted-foreground)]">
                    To
                  </Label>
                  <TextField className="min-w-0 flex-1">
                    <Input
                      value={to}
                      onChange={(event) => setTo(event.target.value)}
                      placeholder="name@example.com"
                      autoComplete="email"
                      className="h-11 border-0 bg-transparent px-0 shadow-none focus:ring-0"
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
                    <div className="flex min-h-11 items-center gap-3">
                      <Label className="w-14 shrink-0 text-xs font-medium text-[var(--muted-foreground)]">
                        Cc
                      </Label>
                      <TextField className="min-w-0 flex-1">
                        <Input
                          value={cc}
                          onChange={(event) => setCc(event.target.value)}
                          placeholder="Optional"
                          className="h-10 border-0 bg-transparent px-0 shadow-none focus:ring-0"
                        />
                      </TextField>
                    </div>
                    <div className="flex min-h-11 items-center gap-3">
                      <Label className="w-14 shrink-0 text-xs font-medium text-[var(--muted-foreground)]">
                        Bcc
                      </Label>
                      <TextField className="min-w-0 flex-1">
                        <Input
                          value={bcc}
                          onChange={(event) => setBcc(event.target.value)}
                          placeholder="Optional"
                          className="h-10 border-0 bg-transparent px-0 shadow-none focus:ring-0"
                        />
                      </TextField>
                    </div>
                  </>
                ) : null}

                <div className="flex min-h-12 items-center gap-3">
                  <Label className="w-14 shrink-0 text-xs font-medium text-[var(--muted-foreground)]">
                    Subject
                  </Label>
                  <TextField className="min-w-0 flex-1">
                    <Input
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      placeholder="Subject"
                      className="h-11 border-0 bg-transparent px-0 shadow-none focus:ring-0"
                    />
                  </TextField>
                </div>
              </div>

              <div className="mx-4 my-3 flex min-h-0 w-[calc(100%-2rem)] flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] sm:mx-5 sm:w-[calc(100%-2.5rem)]">
                <Toolbar
                  aria-label="Message formatting"
                  className="flex min-h-11 w-full shrink-0 flex-nowrap gap-0.5 overflow-x-auto border-b border-[var(--separator)] bg-[var(--surface-secondary)]/60 px-2 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant={editor?.isActive("bold") ? "secondary" : "tertiary"}
                    className={toolButton}
                    aria-label="Bold"
                    onPress={() => editor?.chain().focus().toggleBold().run()}
                  >
                    <Bold className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant={editor?.isActive("italic") ? "secondary" : "tertiary"}
                    className={toolButton}
                    aria-label="Italic"
                    onPress={() => editor?.chain().focus().toggleItalic().run()}
                  >
                    <Italic className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant={editor?.isActive("underline") ? "secondary" : "tertiary"}
                    className={toolButton}
                    aria-label="Underline"
                    onPress={() => editor?.chain().focus().toggleUnderline().run()}
                  >
                    <UnderlineIcon className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant={editor?.isActive("bulletList") ? "secondary" : "tertiary"}
                    className={toolButton}
                    aria-label="Bullet list"
                    onPress={() => editor?.chain().focus().toggleBulletList().run()}
                  >
                    <List className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant={editor?.isActive("orderedList") ? "secondary" : "tertiary"}
                    className={toolButton}
                    aria-label="Numbered list"
                    onPress={() => editor?.chain().focus().toggleOrderedList().run()}
                  >
                    <ListOrdered className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant={editor?.isActive("blockquote") ? "secondary" : "tertiary"}
                    className={toolButton}
                    aria-label="Quote"
                    onPress={() => editor?.chain().focus().toggleBlockquote().run()}
                  >
                    <Quote className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    isIconOnly
                    size="sm"
                    variant={editor?.isActive("link") ? "secondary" : "tertiary"}
                    className={toolButton}
                    aria-label="Add link"
                    onPress={setLink}
                  >
                    <LinkIcon className="size-4" />
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
                    variant={showSignatureEditor ? "secondary" : "tertiary"}
                    className={toolButton}
                    aria-label="Add signature"
                    onPress={() => setShowSignatureEditor((visible) => !visible)}
                  >
                    <Signature className="size-4" />
                  </Button>
                  <span className="mx-1 h-5 w-px bg-[var(--separator)]" aria-hidden />
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
                <EditorContent
                  editor={editor}
                  className="min-h-0 flex-1 overflow-y-auto"
                />
              </div>

              {showSignatureEditor ? (
                <div className="mx-4 mb-3 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/50 p-3 sm:mx-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        Email signature
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        Saved on this device for {fromAddress}.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
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
                <p className="px-4 pb-3 text-sm text-[var(--danger)] sm:px-5" role="alert">
                  {localError || error}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--border)]/70 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:py-3">
              <Button
                type="button"
                variant="tertiary"
                isDisabled={sending}
                onPress={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isPending={sending}
                isDisabled={!fromAddress}
              >
                {sending ? "Sending…" : "Send"}
                <Send className="size-4" />
              </Button>
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
      className="z-50"
    >
      <Modal.Container placement="center" scroll="inside" size="lg">
        <Modal.Dialog className="w-full overflow-hidden p-0 sm:max-w-2xl">
          {composeForm}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
