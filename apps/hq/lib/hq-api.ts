import { api } from '@/lib/api-client';
import type {
  ActivityItem,
  OrdersStats,
  PlatformStats,
  SystemHealth,
  UsersStats,
  VerificationStats,
} from '@/lib/types/admin';
import type {
  AdminUserDetail,
  AdminUserActivityItem,
  AdminUserNote,
  UsersExportResponse,
  UsersListQuery,
  UsersListResponse,
} from '@/lib/types/users';
import type { UserBillingResponse } from '@/lib/types/billing';
import type {
  IdentityDocumentSlot,
  IdentityDocumentViewResponse,
  UserLockoutStatus,
  UserVerificationResponse,
} from '@/lib/types/verification';
import type {
  AdminNotificationChannels,
  AdminNotificationDelivery,
} from '@/lib/types/notifications';
import { usersQueryToApiParams } from '@/lib/users-query';
import { formsQueryToApiParams } from '@/lib/forms-query';
import type {
  AdminFormDetail,
  FormDeletionLogsResponse,
  FormWebhookHealthResponse,
  FormsAnalyticsResponse,
  FormsExportResponse,
  FormsListQuery,
  FormsListResponse,
  FormsStats,
} from '@/lib/types/forms';
import type {
  AdminSupportTicketDetail,
  SupportCannedResponse,
  SupportTicketMessage,
  SupportTicketsListQuery,
  SupportTicketsListResponse,
  SupportTicketsStats,
  UpdateSupportTicketStatusPayload,
} from '@/lib/types/support-tickets';
import { getCsrfToken, ApiException } from '@/lib/api-client';
import { supportTicketsQueryToApiParams } from '@/lib/support-tickets-query';
import { storesQueryToApiParams } from '@/lib/stores-query';
import { mailQueryToApiParams } from '@/lib/mail-query';
import type {
  AdminStoreCategory,
  AdminStoreDetail,
  StoreCategoryPayload,
  StoresListQuery,
  StoresListResponse,
  StoresStats,
} from '@/lib/types/stores';
import type {
  AdminMailAppDetail,
  AdminMailMailbox,
  MailAlertsResponse,
  MailAnalyticsResponse,
  MailAppsExportResponse,
  MailAppsListQuery,
  MailAppsListResponse,
  MailDeliveryListResponse,
  MailDomainRefreshResponse,
  MailDomainsResponse,
  MailStats,
} from '@/lib/types/mail';

export const hqApi = {
  getStats: () => api.get<PlatformStats>('/admin/stats').then((r) => r.data),

  getUsersStats: () =>
    api.get<UsersStats>('/admin/users/stats').then((r) => r.data),

  getFormsStats: () =>
    api.get<FormsStats>('/admin/forms/stats').then((r) => r.data),

  getForms: (query: FormsListQuery = {}) =>
    api
      .get<FormsListResponse>('/admin/forms', formsQueryToApiParams(query))
      .then((r) => r.data),

  getForm: (id: string) =>
    api.get<AdminFormDetail>(`/admin/forms/${id}`).then((r) => r.data),

  getFormDeletionLogs: (params?: {
    page?: number;
    limit?: number;
    formId?: string;
    ownerId?: string;
  }) =>
    api
      .get<FormDeletionLogsResponse>('/admin/forms/deletion-logs', params)
      .then((r) => r.data),

  getFormsAnalytics: (params?: {
    days?: number;
    staleDays?: number;
    limit?: number;
  }) =>
    api
      .get<FormsAnalyticsResponse>('/admin/forms/analytics', params)
      .then((r) => r.data),

  exportForms: (query: Omit<FormsListQuery, 'page' | 'limit'> = {}) =>
    api
      .get<FormsExportResponse>('/admin/forms/export', formsQueryToApiParams(query))
      .then((r) => r.data),

  getFormWebhookHealth: (formId: string) =>
    api
      .get<FormWebhookHealthResponse>(`/admin/forms/${formId}/webhook-health`)
      .then((r) => r.data),

  getOrdersStats: () =>
    api.get<OrdersStats>('/admin/orders/stats').then((r) => r.data),

  getStoreStats: () =>
    api.get<StoresStats>('/admin/stores/stats').then((r) => r.data),

  getStores: (query: StoresListQuery = {}) =>
    api
      .get<StoresListResponse>('/admin/stores', storesQueryToApiParams(query))
      .then((r) => r.data),

  getStore: (id: string) =>
    api.get<AdminStoreDetail>(`/admin/stores/${id}`).then((r) => r.data),

  updateStoreStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
    api.patch(`/admin/stores/${id}/status`, { status }).then((r) => r.data),

  deleteStore: (id: string) =>
    api.delete(`/admin/stores/${id}`).then((r) => r.data),

  getStoreCategories: () =>
    api.get<AdminStoreCategory[]>('/admin/store-categories').then((r) => r.data),

  createStoreCategory: (body: StoreCategoryPayload) =>
    api.post<AdminStoreCategory>('/admin/store-categories', body).then((r) => r.data),

  updateStoreCategory: (id: string, body: StoreCategoryPayload) =>
    api
      .put<AdminStoreCategory>(`/admin/store-categories/${id}`, body)
      .then((r) => r.data),

  deleteStoreCategory: (id: string) =>
    api.delete(`/admin/store-categories/${id}`).then((r) => r.data),

  getVerificationStats: () =>
    api.get<VerificationStats>('/admin/verification/stats').then((r) => r.data),

  getHealth: () => api.get<SystemHealth>('/admin/health').then((r) => r.data),

  getRecentActivity: (limit = 10) =>
    api
      .get<ActivityItem[]>('/admin/recent-activity', { limit })
      .then((r) => r.data),

  getUsers: (query: UsersListQuery = {}) =>
    api
      .get<UsersListResponse>('/admin/users', usersQueryToApiParams(query))
      .then((r) => r.data),

  getUser: (id: string) =>
    api.get<AdminUserDetail>(`/admin/users/${id}`).then((r) => r.data),

  updateUserRole: (id: string, role: string) =>
    api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),

  revokeUserSessions: (id: string) =>
    api.delete(`/admin/users/${id}/sessions`).then((r) => r.data),

  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`).then((r) => r.data),

  getUserBilling: (userId: string) =>
    api
      .get<UserBillingResponse>(`/subscriptions/admin/${userId}`)
      .then((r) => r.data),

  setUserPlan: (
    userId: string,
    plan: string,
    billingCycle?: string,
  ) =>
    api
      .post(`/subscriptions/admin/${userId}/set-plan`, {
        plan,
        billingCycle,
      })
      .then((r) => r.data),

  exportUsers: (query: Omit<UsersListQuery, 'page' | 'limit'> = {}) =>
    api
      .get<UsersExportResponse>('/admin/users/export', usersQueryToApiParams(query))
      .then((r) => r.data),

  deactivateUser: (id: string, reason?: string) =>
    api.patch(`/admin/users/${id}/deactivate`, { reason }).then((r) => r.data),

  reactivateUser: (id: string) =>
    api.patch(`/admin/users/${id}/reactivate`).then((r) => r.data),

  getUserNotes: (userId: string) =>
    api.get<AdminUserNote[]>(`/admin/users/${userId}/notes`).then((r) => r.data),

  addUserNote: (userId: string, note: string) =>
    api.post(`/admin/users/${userId}/notes`, { note }).then((r) => r.data),

  getUserAdminActivity: (userId: string) =>
    api
      .get<AdminUserActivityItem[]>(`/admin/users/${userId}/admin-activity`)
      .then((r) => r.data),

  getUserVerification: (userId: string) =>
    api
      .get<UserVerificationResponse>(`/admin/verification/user/${userId}`)
      .then((r) => r.data),

  getVerificationDocument: (requestId: string, slot: IdentityDocumentSlot) =>
    api
      .get<IdentityDocumentViewResponse>(
        `/admin/verification/${requestId}/document`,
        { slot },
      )
      .then((r) => r.data),

  approveVerification: (requestId: string) =>
    api
      .patch(`/admin/verification/${requestId}/approve`)
      .then((r) => r.data),

  rejectVerification: (requestId: string, reason: string) =>
    api
      .patch(`/admin/verification/${requestId}/reject`, { reason })
      .then((r) => r.data),

  revokeUserVerification: (userId: string, reason?: string) =>
    api
      .patch(`/admin/verification/user/${userId}/revoke`, { reason })
      .then((r) => r.data),

  grantUserIdentityVerification: (userId: string, note?: string) =>
    api
      .patch(`/admin/verification/user/${userId}/grant-identity`, { note })
      .then((r) => r.data),

  grantUserRuknyVerified: (
    userId: string,
    payload: {
      category: 'personal' | 'business' | 'creator';
      displayName: string;
      publicBio?: string;
      note?: string;
    },
  ) =>
    api
      .patch(`/admin/verification/user/${userId}/grant-rukny-verified`, payload)
      .then((r) => r.data),

  revokeUserRuknyVerified: (userId: string, reason?: string) =>
    api
      .patch(`/admin/verification/user/${userId}/revoke-rukny-verified`, {
        reason,
      })
      .then((r) => r.data),

  approveRuknyVerified: (applicationId: string) =>
    api
      .patch(`/admin/verification/rukny-verified/${applicationId}/approve`)
      .then((r) => r.data),

  rejectRuknyVerified: (applicationId: string, reason: string) =>
    api
      .patch(`/admin/verification/rukny-verified/${applicationId}/reject`, {
        reason,
      })
      .then((r) => r.data),

  getUserLockout: (userId: string) =>
    api.get<UserLockoutStatus>(`/admin/users/${userId}/lockout`).then((r) => r.data),

  unlockUserAccount: (userId: string) =>
    api.post(`/admin/users/${userId}/unlock`).then((r) => r.data),

  sendUserNotification: (
    userId: string,
    title: string,
    message: string,
    channels?: AdminNotificationChannels,
  ) =>
    api
      .post<AdminNotificationDelivery>(`/admin/users/${userId}/notify`, {
        title,
        message,
        channels,
      })
      .then((r) => r.data),

  getSupportTickets: (query: SupportTicketsListQuery = {}) =>
    api
      .get<SupportTicketsListResponse>(
        '/admin/support-tickets',
        supportTicketsQueryToApiParams(query),
      )
      .then((r) => r.data),

  getSupportTicketStats: () =>
    api.get<SupportTicketsStats>('/admin/support-tickets/stats').then((r) => r.data),

  getSupportCannedResponses: (locale: 'en' | 'ar' = 'en') =>
    api
      .get<{ responses: SupportCannedResponse[] }>(
        '/admin/support-tickets/canned-responses',
        { locale },
      )
      .then((r) => r.data),

  getSupportTicket: (id: string) =>
    api
      .get<AdminSupportTicketDetail>(`/admin/support-tickets/${id}`)
      .then((r) => r.data),

  updateSupportTicketStatus: (id: string, body: UpdateSupportTicketStatusPayload) =>
    api.patch(`/admin/support-tickets/${id}/status`, body).then((r) => r.data),

  startSupportTicketWork: (id: string) =>
    api.post(`/admin/support-tickets/${id}/start`).then((r) => r.data),

  replyToSupportTicket: (id: string, body: string) =>
    api
      .post<SupportTicketMessage>(`/admin/support-tickets/${id}/reply`, { body })
      .then((r) => r.data),

  assignSupportTicket: (id: string, assignedTo: string | null) =>
    api
      .patch(`/admin/support-tickets/${id}/assign`, { assignedTo })
      .then((r) => r.data),

  addSupportTicketInternalNote: (id: string, body: string) =>
    api
      .post<SupportTicketMessage>(`/admin/support-tickets/${id}/internal-notes`, {
        body,
      })
      .then((r) => r.data),

  uploadSupportTicketAttachment: async (
    id: string,
    file: File,
    messageId?: string,
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    const csrf = getCsrfToken();
    const qs = messageId ? `?messageId=${encodeURIComponent(messageId)}` : '';
    const response = await fetch(
      `/api/v1/admin/support-tickets/${id}/attachments${qs}`,
      {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: csrf ? { 'X-CSRF-Token': csrf } : {},
      },
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiException(
        response.status,
        typeof data.message === 'string' ? data.message : 'Upload failed',
      );
    }
    return data;
  },

  activateMailAppSubscription: (
    appId: string,
    body: {
      plan: string;
      mailboxCount: number;
      ticketId?: string;
      billingCycle?: string;
    },
  ) =>
    api
      .post(`/mail/admin/apps/${encodeURIComponent(appId)}/subscription`, body)
      .then((r) => r.data),

  getMailStats: () => api.get<MailStats>('/admin/mail/stats').then((r) => r.data),

  getMailAnalytics: (params?: { days?: number }) =>
    api
      .get<MailAnalyticsResponse>('/admin/mail/analytics', params)
      .then((r) => r.data),

  getMailAppAnalytics: (appId: string, params?: { days?: number }) =>
    api
      .get<MailAnalyticsResponse>(
        `/admin/mail/apps/${encodeURIComponent(appId)}/analytics`,
        params,
      )
      .then((r) => r.data),

  getMailAlerts: () =>
    api.get<MailAlertsResponse>('/admin/mail/alerts').then((r) => r.data),

  getMailApps: (query: MailAppsListQuery = {}) =>
    api
      .get<MailAppsListResponse>('/admin/mail/apps', mailQueryToApiParams(query))
      .then((r) => r.data),

  exportMailApps: (query: Omit<MailAppsListQuery, 'page' | 'limit' | 'tab'> = {}) =>
    api
      .get<MailAppsExportResponse>('/admin/mail/export', mailQueryToApiParams(query))
      .then((r) => r.data),

  getMailApp: (appId: string) =>
    api
      .get<AdminMailAppDetail>(`/admin/mail/apps/${encodeURIComponent(appId)}`)
      .then((r) => r.data),

  getMailAppMailboxes: (appId: string) =>
    api
      .get<{ mailboxes: AdminMailMailbox[] }>(
        `/admin/mail/apps/${encodeURIComponent(appId)}/mailboxes`,
      )
      .then((r) => r.data),

  updateMailMailboxStatus: (mailboxId: string, status: 'ACTIVE' | 'DISABLED') =>
    api
      .patch(`/admin/mail/mailboxes/${encodeURIComponent(mailboxId)}/status`, {
        status,
      })
      .then((r) => r.data),

  getMailDelivery: (params?: {
    page?: number;
    limit?: number;
    appId?: string;
    days?: number;
  }) =>
    api
      .get<MailDeliveryListResponse>('/admin/mail/delivery', params)
      .then((r) => r.data),

  getMailDomains: () =>
    api.get<MailDomainsResponse>('/admin/mail/domains').then((r) => r.data),

  refreshMailAppDomain: (appId: string) =>
    api
      .post<MailDomainRefreshResponse>(
        `/admin/mail/apps/${encodeURIComponent(appId)}/domain/refresh`,
      )
      .then((r) => r.data),
};
