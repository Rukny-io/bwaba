'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  Calendar,
  Eye,
  EyeOff,
  GitBranch,
  Lock,
  Pin,
  Star,
} from 'lucide-react';
import { Button, Card, Chip, Surface, Switch, cn } from '@heroui/react';
import type { SocialLink, UpdateSocialLinkInput } from '@/lib/links/types';

interface LinkPowerupsTabProps {
  link: SocialLink;
  saving: boolean;
  onTogglePin: () => void;
  onToggleHide: () => void;
  onPatch: (input: UpdateSocialLinkInput) => Promise<void>;
}

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function LinkPowerupsTab({
  link,
  saving,
  onTogglePin,
  onToggleHide,
  onPatch,
}: LinkPowerupsTabProps) {
  const [scheduleStart, setScheduleStart] = useState(
    toDatetimeLocalValue(link.scheduledStartAt),
  );
  const [scheduleEnd, setScheduleEnd] = useState(
    toDatetimeLocalValue(link.scheduledEndAt),
  );
  const [password, setPassword] = useState('');
  const isProtected = Boolean(link.isLocked || link.isPasswordProtected);
  const isScheduled = Boolean(link.scheduledStartAt || link.scheduledEndAt);

  useEffect(() => {
    setScheduleStart(toDatetimeLocalValue(link.scheduledStartAt));
    setScheduleEnd(toDatetimeLocalValue(link.scheduledEndAt));
  }, [link.scheduledStartAt, link.scheduledEndAt]);

  const toggleRows = [
    {
      id: 'pin',
      title: 'تمييز / تثبيت',
      description: 'اجعل الرابط بارزاً في أعلى صفحتك',
      icon: link.isPinned ? Star : Pin,
      active: link.isPinned,
      onClick: onTogglePin,
    },
    {
      id: 'hide',
      title: link.status === 'active' ? 'إخفاء الرابط' : 'إظهار الرابط',
      description:
        link.status === 'active'
          ? 'أخفِ الرابط مؤقتاً عن الزوار'
          : 'أعد إظهار الرابط للزوار',
      icon: link.status === 'active' ? EyeOff : Eye,
      active: link.status === 'hidden',
      onClick: onToggleHide,
    },
    {
      id: 'notify',
      title: 'إشعار عند النقر',
      description: 'استلم إشعاراً كلما نقر زائر على هذا الرابط',
      icon: Bell,
      active: Boolean(link.notifyOnClick),
      onClick: () => {
        void onPatch({ notifyOnClick: !link.notifyOnClick });
      },
    },
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <Card variant="transparent" className="gap-1 p-0 shadow-none">
        <Card.Header className="gap-1">
          <Card.Title className="text-sm font-bold">الإضافات</Card.Title>
          <Card.Description className="text-xs">
            فعّل ميزات إضافية لهذا الرابط
          </Card.Description>
        </Card.Header>
      </Card>

      <div className="flex flex-col gap-2">
        {toggleRows.map((row) => {
          const Icon = row.icon;
          return (
            <button
              key={row.id}
              type="button"
              disabled={saving}
              onClick={row.onClick}
              className="w-full text-start disabled:opacity-60"
            >
              <Card
                variant={row.active ? 'secondary' : 'default'}
                className={cn(
                  'gap-0 p-3 transition-colors sm:p-3.5',
                  row.active && 'border-accent/35 bg-accent-soft/40',
                )}
              >
                <Card.Content className="flex-row items-center gap-3">
                  <Surface
                    variant={row.active ? 'tertiary' : 'secondary'}
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-2xl',
                      row.active ? 'text-accent' : 'text-muted',
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </Surface>
                  <div className="min-w-0 flex-1">
                    <Card.Title className="text-sm font-bold">{row.title}</Card.Title>
                    <Card.Description className="mt-0.5 text-[11px] sm:text-xs">
                      {row.description}
                    </Card.Description>
                  </div>
                  <Switch
                    isSelected={row.active}
                    isReadOnly
                    aria-hidden
                    className="pointer-events-none shrink-0"
                  >
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch>
                </Card.Content>
              </Card>
            </button>
          );
        })}

        <Card
          variant={isScheduled ? 'secondary' : 'default'}
          className={cn('gap-3 p-3 sm:p-3.5', isScheduled && 'border-accent/35')}
        >
          <Card.Content className="flex-row items-start gap-3">
            <Surface
              variant={isScheduled ? 'tertiary' : 'secondary'}
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-2xl',
                isScheduled ? 'text-accent' : 'text-muted',
              )}
            >
              <Calendar className="size-4" aria-hidden />
            </Surface>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <Card.Title className="text-sm font-bold">جدولة الظهور</Card.Title>
                <Card.Description className="mt-0.5 text-[11px] sm:text-xs">
                  حدد متى يظهر الرابط على صفحتك
                </Card.Description>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
                  يبدأ في
                  <input
                    type="datetime-local"
                    value={scheduleStart}
                    onChange={(e) => setScheduleStart(e.target.value)}
                    className="h-9 rounded-lg border border-[var(--border)] bg-transparent px-2.5 text-sm text-[var(--foreground)] outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
                  ينتهي في
                  <input
                    type="datetime-local"
                    value={scheduleEnd}
                    onChange={(e) => setScheduleEnd(e.target.value)}
                    className="h-9 rounded-lg border border-[var(--border)] bg-transparent px-2.5 text-sm text-[var(--foreground)] outline-none"
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  isDisabled={saving}
                  className="h-9 rounded-lg bg-[var(--primary)] px-3 text-sm font-semibold text-[var(--primary-foreground)]"
                  onPress={() =>
                    void onPatch({
                      scheduledStartAt: fromDatetimeLocalValue(scheduleStart),
                      scheduledEndAt: fromDatetimeLocalValue(scheduleEnd),
                    })
                  }
                >
                  حفظ الجدولة
                </Button>
                <Button
                  isDisabled={saving}
                  variant="secondary"
                  className="h-9 rounded-lg px-3 text-sm"
                  onPress={() => {
                    setScheduleStart('');
                    setScheduleEnd('');
                    void onPatch({
                      scheduledStartAt: null,
                      scheduledEndAt: null,
                    });
                  }}
                >
                  مسح
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card
          variant={isProtected ? 'secondary' : 'default'}
          className={cn('gap-3 p-3 sm:p-3.5', isProtected && 'border-accent/35')}
        >
          <Card.Content className="flex-row items-start gap-3">
            <Surface
              variant={isProtected ? 'tertiary' : 'secondary'}
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-2xl',
                isProtected ? 'text-accent' : 'text-muted',
              )}
            >
              <Lock className="size-4" aria-hidden />
            </Surface>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <Card.Title className="text-sm font-bold">قفل الرابط</Card.Title>
                <Card.Description className="mt-0.5 text-[11px] sm:text-xs">
                  اطلب كلمة مرور قبل فتح الرابط
                </Card.Description>
              </div>
              <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
                كلمة المرور
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 rounded-lg border border-[var(--border)] bg-transparent px-2.5 text-sm text-[var(--foreground)] outline-none"
                />
              </label>
              <div className="flex gap-2">
                <Button
                  isDisabled={saving || password.trim().length < 4}
                  className="h-9 rounded-lg bg-[var(--primary)] px-3 text-sm font-semibold text-[var(--primary-foreground)]"
                  onPress={() => {
                    void onPatch({ password: password.trim() }).then(() =>
                      setPassword(''),
                    );
                  }}
                >
                  {isProtected ? 'تغيير كلمة المرور' : 'تفعيل القفل'}
                </Button>
                {isProtected ? (
                  <Button
                    isDisabled={saving}
                    variant="secondary"
                    className="h-9 rounded-lg px-3 text-sm"
                    onPress={() =>
                      void onPatch({ clearPassword: true, isLocked: false }).then(
                        () => setPassword(''),
                      )
                    }
                  >
                    إزالة القفل
                  </Button>
                ) : null}
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card variant="secondary" className="gap-0 border-dashed p-3 opacity-70 sm:p-3.5">
          <Card.Content className="flex-row items-center gap-3">
            <Surface
              variant="secondary"
              className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-muted"
            >
              <GitBranch className="size-4" aria-hidden />
            </Surface>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Card.Title className="text-sm font-semibold">قواعد التوجيه</Card.Title>
                <Chip size="sm" variant="soft">
                  قريباً
                </Chip>
              </div>
              <Card.Description className="mt-0.5 text-[11px] sm:text-xs">
                وجّه الزوار وفق شروط معينة
              </Card.Description>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
