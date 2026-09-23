export type AgPlatform = "linux" | "mac" | "windows" | "web";

export function detectAgPlatform(): AgPlatform {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() ?? "";
  if (platform.includes("linux") || ua.includes("linux")) return "linux";
  if (platform.includes("mac") || ua.includes("mac")) return "mac";
  if (platform.includes("win") || ua.includes("windows")) return "windows";
  return "web";
}

export const AG_PLATFORM_LABEL: Record<AgPlatform, string> = {
  linux: "Linux",
  mac: "macOS",
  windows: "Windows",
  web: "Web",
};
