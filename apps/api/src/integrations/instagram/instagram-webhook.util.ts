const IG_GRAPH_BASE = 'https://graph.instagram.com/v22.0';

const WEBHOOK_SUBSCRIPTION_FIELDS = [
  'messages',
  'comments',
  'live_comments',
] as const;

export async function enableInstagramWebhookSubscriptions(
  accessToken: string,
): Promise<{ ok: boolean; error?: string }> {
  const params = new URLSearchParams({
    subscribed_fields: WEBHOOK_SUBSCRIPTION_FIELDS.join(','),
    access_token: accessToken,
  });

  try {
    const res = await fetch(
      `${IG_GRAPH_BASE}/me/subscribed_apps?${params.toString()}`,
      { method: 'POST' },
    );

    if (!res.ok) {
      const errText = await res.text();
      return {
        ok: false,
        error: `${res.status} ${errText.slice(0, 500)}`,
      };
    }

    const data = (await res.json()) as { success?: boolean };
    if (data.success !== true) {
      return { ok: false, error: 'Meta returned success=false' };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
