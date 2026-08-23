const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || "http://localhost:3001";

export type MailPublicStats = {
  emailsSent: number;
};

export async function getMailPublicStats(): Promise<MailPublicStats> {
  try {
    const res = await fetch(
      `${API_BACKEND_URL.replace(/\/$/, "")}/api/v1/mail/public/stats`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) return { emailsSent: 0 };
    const data = (await res.json()) as { emailsSent?: unknown };
    const emailsSent = Number(data.emailsSent);
    return {
      emailsSent: Number.isFinite(emailsSent) && emailsSent > 0 ? emailsSent : 0,
    };
  } catch {
    return { emailsSent: 0 };
  }
}
