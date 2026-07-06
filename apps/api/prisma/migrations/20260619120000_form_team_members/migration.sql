-- CreateEnum
CREATE TYPE "FormTeamRole" AS ENUM ('ADMIN', 'EDITOR', 'ANALYST', 'VIEWER');

-- CreateTable
CREATE TABLE "form_team_members" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "FormTeamRole" NOT NULL DEFAULT 'VIEWER',
    "permissions" TEXT[],
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedBy" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "form_team_members_workspaceId_idx" ON "form_team_members"("workspaceId");

-- CreateIndex
CREATE INDEX "form_team_members_userId_idx" ON "form_team_members"("userId");

-- CreateIndex
CREATE INDEX "form_team_members_status_idx" ON "form_team_members"("status");

-- CreateIndex
CREATE UNIQUE INDEX "form_team_members_workspaceId_userId_key" ON "form_team_members"("workspaceId", "userId");

-- AddForeignKey
ALTER TABLE "form_team_members" ADD CONSTRAINT "form_team_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_team_members" ADD CONSTRAINT "form_team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_team_members" ADD CONSTRAINT "form_team_members_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
