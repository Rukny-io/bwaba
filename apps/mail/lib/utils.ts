import { cn as herouiCn } from "@heroui/react";

/** shadcn-style `cn` alias — mail app uses HeroUI's cn. */
export function cn(...inputs: Parameters<typeof herouiCn>) {
  return herouiCn(...inputs);
}
