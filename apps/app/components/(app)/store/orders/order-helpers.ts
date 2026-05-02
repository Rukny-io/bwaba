/**
 * 🔧 Order Helpers
 * دوال ومتغيرات مشتركة لمكونات الطلبات
 */

/* ── Avatar Helpers ── */

/** Get initials from name for fallback avatar */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Gentle avatar background colors based on name hash */
export const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ── Date Helpers ── */

export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} ي`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Status Helpers ── */

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "معلق",
    CONFIRMED: "مؤكد",
    PROCESSING: "قيد التجهيز",
    SHIPPED: "تم الشحن",
    DELIVERED: "تم التسليم",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغي",
  };
  return labels[status.toUpperCase()] ?? "معلق";
}
