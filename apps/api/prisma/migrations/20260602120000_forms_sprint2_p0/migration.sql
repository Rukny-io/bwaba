-- Forms Sprint 2: submission slots, idempotency persistence, webhook delivery log

CREATE TABLE "form_submission_slots" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_submission_slots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "form_submission_slots_formId_slotKey_key" ON "form_submission_slots"("formId", "slotKey");
CREATE INDEX "form_submission_slots_formId_idx" ON "form_submission_slots"("formId");

ALTER TABLE "form_submission_slots" ADD CONSTRAINT "form_submission_slots_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "form_submission_idempotency" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "submissionId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_submission_idempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "form_submission_idempotency_formId_idempotencyKey_key" ON "form_submission_idempotency"("formId", "idempotencyKey");
CREATE INDEX "form_submission_idempotency_expiresAt_idx" ON "form_submission_idempotency"("expiresAt");
CREATE INDEX "form_submission_idempotency_submissionId_idx" ON "form_submission_idempotency"("submissionId");

ALTER TABLE "form_submission_idempotency" ADD CONSTRAINT "form_submission_idempotency_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "form_submission_idempotency" ADD CONSTRAINT "form_submission_idempotency_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "form_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "form_webhook_deliveries" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "responseCode" INTEGER,
    "latencyMs" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "form_webhook_deliveries_eventId_key" ON "form_webhook_deliveries"("eventId");
CREATE INDEX "form_webhook_deliveries_formId_createdAt_idx" ON "form_webhook_deliveries"("formId", "createdAt" DESC);
CREATE INDEX "form_webhook_deliveries_status_idx" ON "form_webhook_deliveries"("status");

ALTER TABLE "form_webhook_deliveries" ADD CONSTRAINT "form_webhook_deliveries_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
