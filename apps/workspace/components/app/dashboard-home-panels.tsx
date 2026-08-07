import Link from 'next/link';
import {
  ArrowLeft,
  Globe,
  Inbox,
  Mail,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Button, Card, Chip, Heading, Paragraph } from '@heroui/react';
import { APP_BASE } from '@/components/app/nav-config';
import type {
  DashboardActivityItem,
  WorkspaceDomainItem,
  WorkspaceMessageItem,
} from '@/lib/workspace-dashboard-data';

function PanelHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
      <Heading level={2} className="text-sm sm:text-[15px]">
        {title}
      </Heading>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-[12px] font-medium text-primary transition-opacity hover:opacity-80"
      >
        {linkLabel}
        <ArrowLeft size={12} strokeWidth={2} />
      </Link>
    </div>
  );
}

function PanelEmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: typeof Globe;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-surface-secondary text-primary">
        <Icon size={18} strokeWidth={1.7} />
      </div>
      <Paragraph size="sm" weight="medium">
        {title}
      </Paragraph>
      <Paragraph size="xs" color="muted" className="max-w-[16rem] leading-relaxed">
        {description}
      </Paragraph>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="mt-1">
          <Button variant="primary" size="sm" className="gap-1.5">
            <Plus size={13} strokeWidth={2.2} />
            {actionLabel}
          </Button>
        </Link>
      ) : null}
    </div>
  );
}

const DOMAIN_STATUS_LABELS: Record<WorkspaceDomainItem['status'], string> = {
  pending: 'قيد التحقق',
  verified: 'مُفعّل',
  failed: 'فشل التحقق',
};

const DOMAIN_STATUS_COLOR: Record<
  WorkspaceDomainItem['status'],
  'warning' | 'success' | 'danger'
> = {
  pending: 'warning',
  verified: 'success',
  failed: 'danger',
};

const HOME_PANEL_LIMIT = 3;

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function DashboardHomeRecentDomains({
  domains,
}: {
  domains: WorkspaceDomainItem[];
}) {
  const items = domains.slice(0, HOME_PANEL_LIMIT);

  return (
    <Card className="h-full p-4 sm:p-5">
      <PanelHeader
        title="الدومينات"
        href={`${APP_BASE}/domains`}
        linkLabel="إدارة الدومينات"
      />

      {items.length === 0 ? (
        <PanelEmptyState
          icon={Globe}
          title="لا دومينات مربوطة"
          description="اربط دومينك وأضف سجلات DNS للتحقق."
          actionHref={`${APP_BASE}/domains`}
          actionLabel="ربط دومين"
        />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((domain) => (
            <li key={domain.id}>
              <Link
                href={`${APP_BASE}/domains`}
                className="group flex items-start gap-3 py-2"
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-primary transition-colors group-hover:bg-surface-tertiary">
                  <Globe size={16} strokeWidth={1.7} />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <div className="flex items-start justify-between gap-2">
                    <Paragraph size="sm" weight="semibold" className="truncate">
                      <span dir="ltr" lang="en">
                        {domain.name}
                      </span>
                    </Paragraph>
                    <Chip size="sm" color={DOMAIN_STATUS_COLOR[domain.status]} variant="soft">
                      {DOMAIN_STATUS_LABELS[domain.status]}
                    </Chip>
                  </div>
                  <Paragraph size="xs" color="muted" className="mt-0.5">
                    <span dir="ltr" lang="en">
                      {formatDate(domain.updatedAt)}
                    </span>
                  </Paragraph>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function DashboardHomeRecentMessages({
  messages,
}: {
  messages: WorkspaceMessageItem[];
}) {
  const items = messages.slice(0, HOME_PANEL_LIMIT);

  return (
    <Card className="h-full p-4 sm:p-5">
      <PanelHeader
        title="آخر الرسائل"
        href={`${APP_BASE}/mail`}
        linkLabel="صندوق الوارد"
      />

      {items.length === 0 ? (
        <PanelEmptyState
          icon={Inbox}
          title="لا رسائل بعد"
          description="بعد ربط الدومين وتفعيل الاستقبال ستظهر الرسائل هنا."
          actionHref={`${APP_BASE}/mail/compose`}
          actionLabel="رسالة جديدة"
        />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((message) => (
            <li key={message.id}>
              <Link
                href={message.href}
                className="group flex items-start gap-3 py-2"
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-primary transition-colors group-hover:bg-surface-tertiary">
                  <Inbox size={16} strokeWidth={1.7} />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <Paragraph size="sm" weight="semibold" className="truncate">
                    {message.subject}
                  </Paragraph>
                  <Paragraph size="xs" color="muted" className="mt-0.5 line-clamp-2">
                    {message.from}
                    <span className="mx-1.5 text-border">·</span>
                    {message.preview}
                  </Paragraph>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function activityIcon(type: string) {
  if (type === 'domain_verified') return Globe;
  if (type === 'mailbox_created') return Mail;
  if (type === 'message_received') return Inbox;
  return Sparkles;
}

export function DashboardHomeActivity({
  items,
}: {
  items: DashboardActivityItem[];
}) {
  const list = items.slice(0, HOME_PANEL_LIMIT);

  return (
    <Card className="h-full p-4 sm:p-5">
      <PanelHeader
        title="نشاط مختصر"
        href={`${APP_BASE}/settings`}
        linkLabel="الإعدادات"
      />

      {list.length === 0 ? (
        <PanelEmptyState
          icon={Sparkles}
          title="لا نشاط حديث"
          description="ربط الدومينات وإنشاء صناديق البريد سيظهر هنا."
          actionHref={`${APP_BASE}/domains`}
          actionLabel="ربط دومين"
        />
      ) : (
        <ul className="divide-y divide-border">
          {list.map((item) => {
            const Icon = activityIcon(item.type);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="group flex items-start gap-3 py-2"
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-primary transition-colors group-hover:bg-surface-tertiary">
                    <Icon size={16} strokeWidth={1.7} />
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <Paragraph size="sm" weight="semibold" className="truncate">
                      {item.title}
                    </Paragraph>
                    <Paragraph size="xs" color="muted" className="mt-0.5 line-clamp-2">
                      {item.description}
                      <span className="mx-1.5 text-border">·</span>
                      <span dir="ltr" lang="en">
                        {formatDate(item.createdAt)}
                      </span>
                    </Paragraph>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
