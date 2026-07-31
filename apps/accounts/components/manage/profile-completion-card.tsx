"use client";

import type { ProfileTaskId, UserProfile } from "@/lib/manage/types";
import { ManageProfileTaskSlider } from "./manage-ui";

interface ProfileCompletionCardProps {
  profile: UserProfile;
  onTaskAction: (taskId: ProfileTaskId) => void;
  className?: string;
}

/** Mobile-only inline completion card — desktop uses ManageSidebarCompletion */
export function ProfileCompletionCard({
  profile,
  onTaskAction,
  className,
}: ProfileCompletionCardProps) {
  return (
    <ManageProfileTaskSlider
      profile={profile}
      onTaskAction={onTaskAction}
      variant="inline"
      className={className}
    />
  );
}
