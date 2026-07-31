'use client';

import {
  Calendar,
  Eye,
  EyeOff,
  GitBranch,
  Lock,
  Pin,
  Star,
} from 'lucide-react';
import { Card, Chip, Surface, Switch, cn } from '@heroui/react';
import type { SocialLink } from '@/lib/links/types';

interface LinkPowerupsTabProps {
  link: SocialLink;
  saving: boolean;
  onTogglePin: () => void;
  onToggleHide: () => void;
}

type PowerupRow =
  | {
      id: string;
      title: string;
      description: string;
      icon: typeof Pin;
      enabled: true;
      active?: boolean;
      onClick: () => void;
    }
  | {
      id: string;
      title: string;
      description: string;
      icon: typeof Pin;
      enabled: false;
    };

export function LinkPowerupsTab({
  link,
  saving,
  onTogglePin,
  onToggleHide,
}: LinkPowerupsTabProps) {
  const rows: PowerupRow[] = [
    {
      id: 'pin',
      title: 'تمييز / تثبيت',
      description: 'اجعل الرابط بارزاً في أعلى صفحتك',
      icon: link.isPinned ? Star : Pin,
      enabled: true,
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
      enabled: true,
      active: link.status === 'hidden',
      onClick: onToggleHide,
    },
    {
      id: 'schedule',
      title: 'جدولة الظهور',
      description: 'حدد متى يظهر الرابط على صفحتك',
      icon: Calendar,
      enabled: false,
    },
    {
      id: 'rules',
      title: 'قواعد التوجيه',
      description: 'وجّه الزوار وفق شروط معينة',
      icon: GitBranch,
      enabled: false,
    },
    {
      id: 'lock',
      title: 'قفل الرابط',
      description: 'اطلب كلمة مرور أو شرطاً قبل الفتح',
      icon: Lock,
      enabled: false,
    },
  ];

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
        {rows.map((row) => {
          const Icon = row.icon;

          if (!row.enabled) {
            return (
              <Card
                key={row.id}
                variant="secondary"
                className="gap-0 border-dashed p-3 opacity-70 sm:p-3.5"
              >
                <Card.Content className="flex-row items-center gap-3">
                  <Surface
                    variant="secondary"
                    className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-muted"
                  >
                    <Icon className="size-4" aria-hidden />
                  </Surface>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Card.Title className="text-sm font-semibold">{row.title}</Card.Title>
                      <Chip size="sm" variant="soft">
                        قريباً
                      </Chip>
                    </div>
                    <Card.Description className="mt-0.5 text-[11px] sm:text-xs">
                      {row.description}
                    </Card.Description>
                  </div>
                </Card.Content>
              </Card>
            );
          }

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
      </div>
    </div>
  );
}
