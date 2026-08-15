-- CreateTable
CREATE TABLE "business_workflows" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'سير عمل جديد',
    "description" TEXT,
    "definition" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_workflows_userId_updatedAt_idx" ON "business_workflows"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "business_workflows" ADD CONSTRAINT "business_workflows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
