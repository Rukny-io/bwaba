import { cookies } from 'next/headers';
import { getServerAuthHeaders } from '@rukny/auth/server';
import type { FormDetail, FormType } from '@/lib/forms-api';
import {
  buildCreateFormPayloadFromTemplate,
  getTemplateById,
} from '@/lib/form-templates';

function buildCookieHeader(items: { name: string; value: string }[]): string {
  return items.map((c) => `${c.name}=${c.value}`).join('; ');
}

function getBackendUrl(): string {
  return (
    process.env.API_BACKEND_URL ||
    process.env.API_URL ||
    'http://localhost:3001'
  );
}

export async function fetchFormServer(
  idOrSlug: string,
): Promise<FormDetail | null> {
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore.getAll());

  try {
    const res = await fetch(
      `${getBackendUrl()}/api/v1/forms/${encodeURIComponent(idOrSlug)}`,
      {
        headers: await getServerAuthHeaders(cookieHeader),
        cache: 'no-store',
      },
    );

    if (!res.ok) return null;
    return (await res.json()) as FormDetail;
  } catch {
    return null;
  }
}

/** Creates a draft with server-generated slug; used by `/forms/n/new`. */
export async function createFormDraftServer(): Promise<FormDetail | null> {
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore.getAll());

  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/forms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getServerAuthHeaders(cookieHeader)),
      },
      body: JSON.stringify({
        title: 'نموذج جديد',
        type: 'OTHER' satisfies FormType,
        status: 'DRAFT',
      }),
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return (await res.json()) as FormDetail;
  } catch {
    return null;
  }
}

/** Creates a draft from a template id — used by `/forms/n/new?template=`. */
export async function createFormFromTemplateServer(
  templateId: string,
): Promise<FormDetail | null> {
  const template = getTemplateById(templateId);
  if (!template) return null;

  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore.getAll());

  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/forms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getServerAuthHeaders(cookieHeader)),
      },
      body: JSON.stringify(buildCreateFormPayloadFromTemplate(template)),
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return (await res.json()) as FormDetail;
  } catch {
    return null;
  }
}
