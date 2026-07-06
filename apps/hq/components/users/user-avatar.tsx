'use client';

import { useEffect, useState } from 'react';
import { resolveMediaUrl } from '@/lib/media-url';
import { userInitials } from '@/lib/users-format';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email: string;
  className?: string;
  initialsClassName?: string;
}

export function UserAvatar({
  src,
  name,
  email,
  className,
  initialsClassName,
}: UserAvatarProps) {
  const resolved = resolveMediaUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (resolved && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved}
        alt=""
        className={cn('size-full object-cover', className)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex size-full items-center justify-center font-semibold text-[var(--muted-foreground)]',
        initialsClassName,
      )}
    >
      {userInitials(name ?? null, email)}
    </span>
  );
}
