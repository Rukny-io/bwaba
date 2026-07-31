import type { LucideIcon } from "lucide-react";
import {
  AtSign,
  Camera,
  FileText,
  Phone,
  User,
} from "lucide-react";
import type { IconTone, ProfileTaskId, UserProfile } from "./types";

export interface ProfileTask {
  id: ProfileTaskId;
  completed: boolean;
  icon: LucideIcon;
  tone: IconTone;
}

export function getProfileTasks(profile: UserProfile): ProfileTask[] {
  const p = profile.profile;

  return [
    {
      id: "avatar",
      completed: Boolean(p?.avatar),
      icon: Camera,
      tone: "green",
    },
    {
      id: "name",
      completed: Boolean(p?.name?.trim()),
      icon: User,
      tone: "purple",
    },
    {
      id: "username",
      completed: Boolean(p?.username?.trim()),
      icon: AtSign,
      tone: "teal",
    },
    {
      id: "bio",
      completed: Boolean(p?.bio?.trim()),
      icon: FileText,
      tone: "orange",
    },
    {
      id: "phone",
      completed: Boolean(profile.phone?.trim()),
      icon: Phone,
      tone: "green",
    },
  ];
}

export function getProfileCompletion(profile: UserProfile) {
  const tasks = getProfileTasks(profile);
  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const pending = tasks.filter((t) => !t.completed);

  return {
    tasks,
    pending,
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    isComplete: completed === total,
  };
}
