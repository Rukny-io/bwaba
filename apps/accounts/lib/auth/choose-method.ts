import type { VerificationMethod } from "@/components/auth/method-chooser"

export const VERIFICATION_METHODS: VerificationMethod[] = [
  "authenticator",
  "backup-code",
  "email",
  "whatsapp",
]

export function parseVerificationMethod(
  value: string | undefined,
): VerificationMethod | null {
  if (!value) return null
  return VERIFICATION_METHODS.includes(value as VerificationMethod)
    ? (value as VerificationMethod)
    : null
}

export function isVerificationMethodAvailable(
  method: VerificationMethod,
  has2FA: boolean,
  isSubscribed: boolean,
): boolean {
  if (method === "email") return true
  if (method === "authenticator" || method === "backup-code") return has2FA
  if (method === "whatsapp") return isSubscribed
  return false
}

export function chooseMethodPath(
  method: VerificationMethod,
  opts?: { sessionId?: string | null; email?: string | null },
): string {
  const path = `/choose-method/${method}`
  if (!opts?.sessionId && !opts?.email) return path
  const params = new URLSearchParams()
  if (opts.sessionId) params.set("sessionId", opts.sessionId)
  if (opts.email) params.set("email", opts.email)
  return `${path}?${params.toString()}`
}
