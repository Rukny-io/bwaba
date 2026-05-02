'use client';

import { Bell, MessageCircle } from 'lucide-react';
import type { AuthUser } from '@/lib/api/auth';

interface DashboardHeaderProps {
  user: AuthUser;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const firstName = user.name?.split(' ')[0] || user.username || 'هناك';

  return (
    <header className="flex items-center justify-between gap-4 mb-8">

      {/* يسار — التحية */}
      <div className="shrink-0">
        <h1 className="text-xl font-bold text-[var(--foreground)] leading-tight">
          Hello, {firstName}!
        </h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">
          Explore information and activity about your property
        </p>
      </div>

      {/* يمين — أيقونات */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Messages */}
        <button
          className="relative w-11 h-11 rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--foreground)] hover:bg-[var(--surface)] transition-all"
          aria-label="الرسائل"
        >
          <MessageCircle size={18} strokeWidth={1.7} />
          {/* dot */}
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>

        {/* Notifications */}
        <button
          className="relative w-11 h-11 rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--foreground)] hover:bg-[var(--surface)] transition-all"
          aria-label="الإشعارات"
        >
          <Bell size={18} strokeWidth={1.7} />
        </button>
      </div>

    </header>
  );
}

