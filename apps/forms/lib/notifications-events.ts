export const NOTIFICATIONS_CHANGED_EVENT = 'rukny:forms-notifications-changed';

export function emitNotificationsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  }
}
