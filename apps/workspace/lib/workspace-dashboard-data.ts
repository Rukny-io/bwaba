export interface MetricCardData {
  value: string;
  trend?: string;
  trendPositive?: boolean;
  chip?: string;
  chipTone?: 'success' | 'warning' | 'neutral' | 'danger';
}

export interface WorkspaceDashboardMetrics {
  linkedDomains: MetricCardData;
  mailboxes: MetricCardData;
  unreadMessages: MetricCardData;
  deliveryRate: MetricCardData;
}

export interface DashboardActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  href: string;
  createdAt: string;
}

export interface WorkspaceDomainItem {
  id: string;
  name: string;
  status: 'pending' | 'verified' | 'failed';
  updatedAt: string;
}

export interface WorkspaceMessageItem {
  id: string;
  subject: string;
  from: string;
  preview: string;
  href: string;
  createdAt: string;
}

export interface WorkspaceDashboardHomeData {
  metrics: WorkspaceDashboardMetrics;
  recentDomains: WorkspaceDomainItem[];
  recentMessages: WorkspaceMessageItem[];
  recentActivity: DashboardActivityItem[];
}

export async function getWorkspaceDashboardHomeData(): Promise<WorkspaceDashboardHomeData> {
  return {
    metrics: {
      linkedDomains: {
        value: '0',
        chip: 'MVP',
        chipTone: 'neutral',
      },
      mailboxes: {
        value: '0',
        chip: 'حتى 3',
        chipTone: 'neutral',
      },
      unreadMessages: {
        value: '0',
        chip: 'جديد',
        chipTone: 'neutral',
      },
      deliveryRate: {
        value: '—',
        chip: 'قريباً',
        chipTone: 'warning',
      },
    },
    recentDomains: [],
    recentMessages: [],
    recentActivity: [],
  };
}
