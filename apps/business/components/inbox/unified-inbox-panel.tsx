'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Inbox, Instagram, MessageCircle, MessagesSquare, Send } from 'lucide-react';
import {
  fetchInboxAccounts,
  fetchInboxConversations,
  fetchInboxMessages,
  markInboxConversationRead,
  parseInboxChannelTab,
  sendInboxMessage,
  type InboxChannelTab,
  type InboxConversation,
  type InboxMessage,
} from '@/lib/inbox';
import type { InstagramConnection } from '@/lib/instagram';
import { appToast } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

function PanelShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-[1.75rem] bg-[var(--surface)] sm:rounded-[2rem]',
        className,
      )}
    >
      {children}
    </section>
  );
}

function ConversationListEmpty({
  hasInstagramAccounts,
  channelTab,
}: {
  hasInstagramAccounts: boolean;
  channelTab: InboxChannelTab;
}) {
  const isMessenger = channelTab === 'messenger';

  return (
    <div className="flex flex-col items-center gap-1.5 px-3 py-6 text-center">
      <div className="flex size-8 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)]">
        {isMessenger ? (
          <MessageCircle className="size-3.5" strokeWidth={1.8} aria-hidden />
        ) : (
          <MessagesSquare className="size-3.5" strokeWidth={1.8} aria-hidden />
        )}
      </div>
      <p className="text-[12px] font-semibold text-[var(--foreground)]">
        {isMessenger
          ? 'Messenger قريباً'
          : hasInstagramAccounts
            ? 'لا توجد محادثات'
            : 'لا حسابات مربوطة'}
      </p>
      <p className="max-w-[14rem] text-[11px] leading-snug text-[var(--muted-foreground)]">
        {isMessenger
          ? 'ستظهر المحادثات هنا.'
          : hasInstagramAccounts
            ? 'أرسل DM لحسابك على Instagram لتظهر هنا.'
            : 'اربط Instagram لاستقبال الرسائل.'}
      </p>
      {!hasInstagramAccounts && !isMessenger ? (
        <Link
          href="/app/instagram"
          className="mt-0.5 text-[11px] font-semibold text-[var(--primary)] hover:underline"
        >
          ربط Instagram
        </Link>
      ) : null}
    </div>
  );
}

function ConversationListPane({
  loading,
  conversations,
  selectedConversationId,
  hasInstagramAccounts,
  channelTab,
  onSelect,
  className,
}: {
  loading: boolean;
  conversations: InboxConversation[];
  selectedConversationId: string | null;
  hasInstagramAccounts: boolean;
  channelTab: InboxChannelTab;
  onSelect: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-h-0 min-w-0 flex-col border-[var(--border)]/60 md:border-e',
        className,
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="px-3 py-6 text-center text-[12px] text-[var(--muted-foreground)]">
            جارٍ التحميل…
          </p>
        ) : conversations.length === 0 ? (
          <ConversationListEmpty
            hasInstagramAccounts={hasInstagramAccounts}
            channelTab={channelTab}
          />
        ) : (
          conversations.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              active={conversation.id === selectedConversationId}
              onSelect={() => onSelect(conversation.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ConversationRow({
  conversation,
  active,
  onSelect,
}: {
  conversation: InboxConversation;
  active: boolean;
  onSelect: () => void;
}) {
  const ChannelIcon = conversation.channel === 'instagram' ? Instagram : MessageCircle;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-start transition-colors',
        active
          ? 'bg-[var(--surface-secondary)]'
          : 'hover:bg-[var(--surface-secondary)]/70',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--surface-secondary)]',
          conversation.channel === 'instagram' ? 'text-[#bc1888]' : 'text-[var(--primary)]',
        )}
      >
        {conversation.participantAvatarUrl ? (
          <Image
            src={conversation.participantAvatarUrl}
            alt=""
            width={40}
            height={40}
            className="size-full object-cover"
            unoptimized
          />
        ) : (
          <ChannelIcon className="size-4" strokeWidth={1.8} aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-semibold text-[var(--foreground)]">
            {conversation.participantName}
          </span>
          {conversation.unreadCount > 0 ? (
            <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--primary-foreground)]">
              {conversation.unreadCount}
            </span>
          ) : null}
        </span>
        <span className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
          {conversation.preview}
        </span>
      </span>
    </button>
  );
}

function formatMessageTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function ConversationThread({
  conversation,
  onConversationUpdated,
}: {
  conversation: InboxConversation | null;
  onConversationUpdated: (conversation: InboxConversation) => void;
}) {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const windowExpired = useMemo(() => {
    if (!conversation?.messagingWindowExpiresAt) return false;
    return new Date(conversation.messagingWindowExpiresAt) < new Date();
  }, [conversation?.messagingWindowExpiresAt]);

  const loadMessages = useCallback(async () => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const { messages: list, conversation: updated } = await fetchInboxMessages(
        conversation.id,
      );
      setMessages(list);
      onConversationUpdated(updated);
      if (updated.unreadCount > 0) {
        const { conversation: read } = await markInboxConversationRead(conversation.id);
        onConversationUpdated(read);
      }
    } catch (error) {
      appToast.fromError(error, 'تعذر تحميل الرسائل');
    } finally {
      setLoading(false);
    }
  }, [conversation, onConversationUpdated]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (!conversation || !draft.trim() || sending || windowExpired) return;

    setSending(true);
    try {
      const { message, conversation: updated } = await sendInboxMessage(
        conversation.id,
        draft.trim(),
      );
      setDraft('');
      setMessages((prev) => [...prev, message]);
      onConversationUpdated(updated);
    } catch (error) {
      appToast.fromError(error, 'تعذر إرسال الرسالة');
    } finally {
      setSending(false);
    }
  }

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <Inbox className="size-8 text-[var(--muted-foreground)]/40" strokeWidth={1.5} aria-hidden />
        <p className="text-[13px] text-[var(--muted-foreground)]">اختر محادثة لعرض الرسائل</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-[var(--border)]/60 px-4 py-3 sm:px-5">
        <p className="text-[14px] font-semibold text-[var(--foreground)]">
          {conversation.participantName}
        </p>
        {conversation.participantUsername ? (
          <p className="text-[12px] text-[var(--muted-foreground)]" dir="ltr">
            @{conversation.participantUsername}
          </p>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        {loading ? (
          <p className="py-8 text-center text-[12px] text-[var(--muted-foreground)]">
            جارٍ تحميل الرسائل…
          </p>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-[12px] text-[var(--muted-foreground)]">
            لا توجد رسائل بعد
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((message) => {
              const outbound = message.direction === 'outbound';
              return (
                <div
                  key={message.id}
                  className={cn('flex', outbound ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                      outbound
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'bg-[var(--surface-secondary)] text-[var(--foreground)]',
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <p
                      className={cn(
                        'mt-1 text-[10px]',
                        outbound
                          ? 'text-[var(--primary-foreground)]/70'
                          : 'text-[var(--muted-foreground)]',
                      )}
                    >
                      {formatMessageTime(message.sentAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-[var(--border)]/60 p-3 sm:p-4"
      >
        {windowExpired ? (
          <p className="mb-2 text-[11px] text-amber-600 dark:text-amber-400">
            انتهت نافذة الرد (24 ساعة). انتظر رسالة جديدة من العميل.
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={1}
            placeholder="اكتب رداً…"
            disabled={sending || windowExpired}
            className="min-h-10 max-h-28 flex-1 resize-none rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-secondary)]/50 px-3.5 py-2.5 text-[13px] outline-none focus:border-[var(--primary)]/40 disabled:opacity-60"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void handleSend(event);
              }
            }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending || windowExpired}
            aria-label="إرسال"
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] transition-opacity disabled:opacity-40"
          >
            <Send className="size-4" strokeWidth={1.8} aria-hidden />
          </button>
        </div>
      </form>
    </div>
  );
}

export function UnifiedInboxPanel() {
  const searchParams = useSearchParams();
  const channelTab = parseInboxChannelTab(searchParams.get('channel'));
  const conversationFromUrl = searchParams.get('conversation');

  const [accounts, setAccounts] = useState<InstagramConnection[]>([]);
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    conversationFromUrl,
  );
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [accountList, conversationList] = await Promise.all([
        fetchInboxAccounts(),
        fetchInboxConversations({ channel: channelTab }),
      ]);
      setAccounts(accountList);
      setConversations(conversationList);
    } catch (error) {
      appToast.fromError(error, 'تعذر تحميل صندوق الوارد');
    } finally {
      setLoading(false);
    }
  }, [channelTab]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setSelectedConversationId(conversationFromUrl);
  }, [conversationFromUrl, channelTab]);

  useEffect(() => {
    if (!conversationFromUrl || loading) return;

    const exists = conversations.some((conversation) => conversation.id === conversationFromUrl);
    if (!exists) {
      setSelectedConversationId(null);
    }
  }, [conversationFromUrl, conversations, loading]);

  const handleConversationUpdated = useCallback((updated: InboxConversation) => {
    setConversations((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
  }, []);

  const filteredConversations = useMemo(() => {
    if (channelTab === 'all') return conversations;
    return conversations.filter((c) => c.channel === channelTab);
  }, [conversations, channelTab]);

  const selectedConversation =
    filteredConversations.find((c) => c.id === selectedConversationId) ??
    conversations.find((c) => c.id === selectedConversationId) ??
    null;

  const showThreadOnMobile = Boolean(selectedConversationId);

  return (
    <section className="flex h-full min-h-0 flex-col">
      <PanelShell className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(13rem,26%)_1fr]">
          <ConversationListPane
            loading={loading}
            conversations={filteredConversations}
            selectedConversationId={selectedConversationId}
            hasInstagramAccounts={accounts.length > 0}
            channelTab={channelTab}
            onSelect={setSelectedConversationId}
            className={cn(showThreadOnMobile ? 'hidden md:flex' : 'flex')}
          />

          <div
            className={cn(
              'flex min-h-0 min-w-0 flex-col',
              showThreadOnMobile ? 'flex' : 'hidden md:flex',
            )}
          >
            {showThreadOnMobile ? (
              <button
                type="button"
                onClick={() => setSelectedConversationId(null)}
                className="border-b border-[var(--border)]/60 px-4 py-2 text-[12px] font-semibold text-[var(--primary)] md:hidden"
              >
                ← المحادثات
              </button>
            ) : null}
            <ConversationThread
              conversation={selectedConversation}
              onConversationUpdated={handleConversationUpdated}
            />
          </div>
        </div>
      </PanelShell>
    </section>
  );
}
