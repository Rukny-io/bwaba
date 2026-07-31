import type { ReactNode } from 'react';

export default function NotificationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="notifications-mobile-route -mx-4 -mt-10 flex min-h-[calc(100dvh-5.75rem)] flex-col sm:-mx-4 sm:-mt-12 lg:mx-0 lg:mt-0 lg:min-h-0">
      {children}
    </div>
  );
}
