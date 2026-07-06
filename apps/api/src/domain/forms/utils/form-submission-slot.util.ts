/**
 * Builds a DB-enforced submission slot key when duplicate submissions must be blocked.
 * Returns null when duplicates are allowed or the respondent cannot be identified.
 */
export function buildSubmissionSlotKey(
  form: {
    allowMultipleSubmissions: boolean;
    oneResponsePerUser: boolean;
  },
  userId?: string | null,
): string | null {
  if (!userId) return null;
  if (!form.allowMultipleSubmissions) {
    return `user:${userId}`;
  }
  if (form.oneResponsePerUser) {
    return `user:${userId}`;
  }
  return null;
}
