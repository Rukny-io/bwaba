-- Mail team: invite expiry, resend tracking, and email-only invites for non-registered users.

ALTER TABLE "mail_app_members" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "mail_app_members" ADD COLUMN IF NOT EXISTS "lastResendAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "mail_app_members_expiresAt_idx" ON "mail_app_members"("expiresAt");

CREATE TABLE IF NOT EXISTS "mail_app_email_invites" (
    "id" TEXT NOT NULL,
    "mailAppId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MailAppMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedBy" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastResendAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_app_email_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "mail_app_email_invites_token_key" ON "mail_app_email_invites"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "mail_app_email_invites_mailAppId_email_key" ON "mail_app_email_invites"("mailAppId", "email");
CREATE INDEX IF NOT EXISTS "mail_app_email_invites_mailAppId_idx" ON "mail_app_email_invites"("mailAppId");
CREATE INDEX IF NOT EXISTS "mail_app_email_invites_email_idx" ON "mail_app_email_invites"("email");
CREATE INDEX IF NOT EXISTS "mail_app_email_invites_status_idx" ON "mail_app_email_invites"("status");
CREATE INDEX IF NOT EXISTS "mail_app_email_invites_expiresAt_idx" ON "mail_app_email_invites"("expiresAt");

DO $$ BEGIN
  ALTER TABLE "mail_app_email_invites"
    ADD CONSTRAINT "mail_app_email_invites_mailAppId_fkey"
    FOREIGN KEY ("mailAppId") REFERENCES "mail_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "mail_app_email_invites"
    ADD CONSTRAINT "mail_app_email_invites_invitedBy_fkey"
    FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
