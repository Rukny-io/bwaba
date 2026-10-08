import { ApiException } from '@/lib/api-client';
import { getCsrfToken } from '@rukny/auth/client/csrf-cookie';
import {
  ACTIVE_WORKSPACE_HEADER,
  readActiveWorkspaceIdFromBrowser,
} from '@/lib/workspace';

function parseFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;
  const match = /filename="([^"]+)"/i.exec(contentDisposition);
  return match?.[1] ?? null;
}

export async function downloadStoreOrderInvoice(orderId: string): Promise<void> {
  if (orderId.startsWith('mock-')) {
    throw new ApiException(400, 'الفاتورة غير متاحة للطلبات التجريبية.');
  }

  const headers: Record<string, string> = {};
  const workspaceId = readActiveWorkspaceIdFromBrowser();
  if (workspaceId) {
    headers[ACTIVE_WORKSPACE_HEADER] = workspaceId;
  }

  const csrf = getCsrfToken();
  if (csrf) headers['X-CSRF-Token'] = csrf;

  const response = await fetch(
    `/api/v1/orders/store/orders/${encodeURIComponent(orderId)}/invoice`,
    {
      method: 'GET',
      credentials: 'include',
      headers,
    },
  );

  if (!response.ok) {
    let message = 'تعذّر إنشاء الفاتورة';
    try {
      const data = await response.json();
      if (typeof data?.message === 'string') message = data.message;
      else if (Array.isArray(data?.message)) message = data.message.join(', ');
    } catch {
      /* binary or empty */
    }
    throw new ApiException(response.status, message);
  }

  const blob = await response.blob();
  const filename =
    parseFilename(response.headers.get('Content-Disposition')) ??
    `invoice-${orderId}.pdf`;

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
