'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  LifeBuoy,
  Lock,
  Loader2,
  MessageSquare,
  Settings2,
  type LucideIcon,
} from 'lucide-react';
import { Chip } from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type {
  AdminSupportTicketDetail,
  SupportTicketMessage,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@/lib/types/support-tickets';
import {
  formatTicketCategory,
  formatTicketPriority,
  formatTicketStatus,
  ticketPriorityChipColor,
  ticketStatusChipColor,
} from '@/lib/support-tickets-format';
import { SupportTicketConversationPanel } from '@/components/support-tickets/support-ticket-conversation-panel';
import { SupportTicketManagePanel } from '@/components/support-tickets/support-ticket-manage-panel';
import { SupportTicketNotesPanel } from '@/components/support-tickets/support-ticket-notes-panel';
import { SupportTicketOverviewPanel } from '@/components/support-tickets/support-ticket-overview-panel';
import {
  workspaceTabClassName,
  workspaceTabGroupClassName,
} from '@/components/ui/pill-tab';
import { useSupportTicketLive } from '@/hooks/use-support-ticket-live';
import type { LiveSupportMessage } from '@/lib/support-tickets-socket';

type SupportTicketDetailTab = 'overview' | 'conversation' | 'notes' | 'manage';

const TAB_IDS: SupportTicketDetailTab[] = [
  'overview',
  'conversation',
  'notes',
  'manage',
];

const TABS: { id: SupportTicketDetailTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'conversation', label: 'Conversation', icon: MessageSquare },
  { id: 'notes', label: 'Internal notes', icon: Lock },
  { id: 'manage', label: 'Manage', icon: Settings2 },
];

const ACTIVE_STATUSES: SupportTicketStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_ON_USER',
];

function parseTabParam(value: string | null): SupportTicketDetailTab {
  if (value && TAB_IDS.includes(value as SupportTicketDetailTab)) {
    return value as SupportTicketDetailTab;
  }
  return 'overview';
}

function toTicketMessage(
  message: SupportTicketMessage | LiveSupportMessage,
): SupportTicketMessage {
  return {
    id: message.id,
    ticketId: message.ticketId,
    authorId: message.authorId,
    body: message.body,
    isStaff: message.isStaff,
    isInternal: 'isInternal' in message ? message.isInternal : undefined,
    createdAt:
      typeof message.createdAt === 'string'
        ? message.createdAt
        : new Date(message.createdAt).toISOString(),
    attachments:
      'attachments' in message
        ? (message as SupportTicketMessage).attachments
        : undefined,
  };
}

function appendTicketMessage<T extends { messages: SupportTicketMessage[] }>(
  ticket: T,
  message: SupportTicketMessage | LiveSupportMessage,
): T {
  if (ticket.messages.some((item) => item.id === message.id)) {
    return ticket;
  }
  return {
    ...ticket,
    messages: [...ticket.messages, toTicketMessage(message)],
  };
}

interface SupportTicketDetailViewProps {
  ticketId: string;
  currentAdminId: string;
}

export function SupportTicketDetailView({
  ticketId,
  currentAdminId,
}: SupportTicketDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ticket, setTicket] = useState<AdminSupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusDraft, setStatusDraft] = useState<SupportTicketStatus>('OPEN');
  const [priorityDraft, setPriorityDraft] = useState<SupportTicketPriority>('MEDIUM');
  const [assignDraft, setAssignDraft] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [adminOptions, setAdminOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [activeTab, setActiveTab] = useState<SupportTicketDetailTab>(() =>
    parseTabParam(searchParams.get('tab')),
  );

  useEffect(() => {
    setActiveTab(parseTabParam(searchParams.get('tab')));
  }, [searchParams]);

  const loadTicket = useCallback(async () => {
    setLoading(true);
    try {
      const [data, adminsRes] = await Promise.all([
        hqApi.getSupportTicket(ticketId),
        hqApi.getUsers({ role: 'ADMIN', limit: 50 }),
      ]);
      setTicket(data);
      setStatusDraft(data.status);
      setPriorityDraft(data.priority);
      setAssignDraft(data.assignedTo ?? '');
      setAdminOptions(
        adminsRes.data.map((admin) => ({
          value: admin.id,
          label: admin.email,
        })),
      );
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load ticket',
      );
      router.replace('/app/support-tickets');
    } finally {
      setLoading(false);
    }
  }, [ticketId, router]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  const { isLive } = useSupportTicketLive(ticketId, {
    isStaff: true,
    onMessage: (message) => {
      setTicket((prev) => (prev ? appendTicketMessage(prev, message) : prev));
    },
    onInternalMessage: (message) => {
      setTicket((prev) =>
        prev
          ? appendTicketMessage(prev, { ...message, isInternal: true })
          : prev,
      );
    },
    onTicketUpdated: (update) => {
      setTicket((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...(update.status
            ? { status: update.status as SupportTicketStatus }
            : {}),
          ...(update.priority
            ? { priority: update.priority as SupportTicketPriority }
            : {}),
          ...(update.assignedTo !== undefined
            ? { assignedTo: update.assignedTo }
            : {}),
          ...(update.closedAt !== undefined ? { closedAt: update.closedAt } : {}),
        };
      });
      if (update.status) setStatusDraft(update.status as SupportTicketStatus);
      if (update.priority) setPriorityDraft(update.priority as SupportTicketPriority);
      if (update.assignedTo !== undefined) setAssignDraft(update.assignedTo ?? '');
    },
  });

  const canReply = ticket && ACTIVE_STATUSES.includes(ticket.status);
  const canStartWork =
    ticket &&
    (ticket.status === 'OPEN' || ticket.status === 'WAITING_ON_USER');

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setBusy(true);
    try {
      await action();
      appToast.success(successMessage);
      await loadTicket();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Action failed',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleStartWork() {
    await runAction(
      () => hqApi.startSupportTicketWork(ticketId),
      'Work started on ticket',
    );
  }

  async function handleReply() {
    const body = reply.trim();
    if (!body) return;
    setBusy(true);
    try {
      const message = await hqApi.replyToSupportTicket(ticketId, body);
      setReply('');
      setTicket((prev) => (prev ? appendTicketMessage(prev, message) : prev));
      appToast.success('Reply sent');
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not send reply',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusUpdate() {
    if (!ticket) return;
    if (
      statusDraft === ticket.status &&
      priorityDraft === ticket.priority &&
      assignDraft === (ticket.assignedTo ?? '')
    ) {
      return;
    }
    await runAction(async () => {
      if (statusDraft !== ticket.status || priorityDraft !== ticket.priority) {
        await hqApi.updateSupportTicketStatus(ticketId, {
          status: statusDraft,
          priority: priorityDraft !== ticket.priority ? priorityDraft : undefined,
        });
      }
      if (assignDraft !== (ticket.assignedTo ?? '')) {
        await hqApi.assignSupportTicket(ticketId, assignDraft || null);
      }
    }, 'Ticket updated');
  }

  async function handleInternalNote() {
    const body = internalNote.trim();
    if (!body) return;
    setBusy(true);
    try {
      const message = await hqApi.addSupportTicketInternalNote(ticketId, body);
      setInternalNote('');
      setTicket((prev) =>
        prev
          ? appendTicketMessage(prev, { ...message, isInternal: true })
          : prev,
      );
      appToast.success('Internal note added');
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Action failed',
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading || !ticket) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const internalMessages = ticket.messages.filter((message) => message.isInternal);
  const assignOptions = [{ value: '', label: 'Unassigned' }, ...adminOptions];

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <Link
            href="/app/support-tickets"
            className="inline-flex items-center gap-1 rounded-lg py-0.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            Support
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Chip color={ticketStatusChipColor(ticket.status)} size="sm" variant="soft">
              {formatTicketStatus(ticket.status)}
            </Chip>
            <Chip color={ticketPriorityChipColor(ticket.priority)} size="sm" variant="soft">
              {formatTicketPriority(ticket.priority)}
            </Chip>
            <span className="inline-flex rounded-full bg-[var(--surface-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted-foreground)]">
              {formatTicketCategory(ticket.category)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <LifeBuoy className="size-6" aria-hidden />
          </div>
          <div className="min-w-0 max-w-lg">
            <h1 className="truncate text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
              {ticket.subject}
            </h1>
            <p
              className="mt-0.5 truncate font-mono text-sm text-[var(--muted-foreground)]"
              dir="ltr"
            >
              {ticket.number}
            </p>
          </div>
        </div>

        <nav
          className={workspaceTabGroupClassName}
          aria-label="Support ticket sections"
          role="tablist"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveTab(tab.id);
                  const params = new URLSearchParams(searchParams.toString());
                  if (tab.id === 'overview') {
                    params.delete('tab');
                  } else {
                    params.set('tab', tab.id);
                  }
                  const qs = params.toString();
                  router.replace(qs ? `${pathname}?${qs}` : pathname, {
                    scroll: false,
                  });
                }}
                className={workspaceTabClassName(isActive)}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <div role="tabpanel">
        {activeTab === 'overview' ? (
          <SupportTicketOverviewPanel
            ticket={ticket}
            currentAdminId={currentAdminId}
            canStartWork={Boolean(canStartWork)}
            busy={busy}
            onStartWork={() => void handleStartWork()}
          />
        ) : null}

        {activeTab === 'conversation' ? (
          <SupportTicketConversationPanel
            ticket={ticket}
            isLive={isLive}
            reply={reply}
            busy={busy}
            canReply={Boolean(canReply)}
            onReplyChange={setReply}
            onSendReply={() => void handleReply()}
          />
        ) : null}

        {activeTab === 'notes' ? (
          <SupportTicketNotesPanel
            messages={internalMessages}
            internalNote={internalNote}
            busy={busy}
            onInternalNoteChange={setInternalNote}
            onAddNote={() => void handleInternalNote()}
          />
        ) : null}

        {activeTab === 'manage' ? (
          <SupportTicketManagePanel
            ticket={ticket}
            statusDraft={statusDraft}
            priorityDraft={priorityDraft}
            assignDraft={assignDraft}
            assignOptions={assignOptions}
            busy={busy}
            onStatusChange={setStatusDraft}
            onPriorityChange={setPriorityDraft}
            onAssignChange={setAssignDraft}
            onSave={() => void handleStatusUpdate()}
          />
        ) : null}
      </div>
    </div>
  );
}
