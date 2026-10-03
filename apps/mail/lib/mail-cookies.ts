type MailCookieWriteOptions = {
  path: string;
  maxAge: number;
  sameSite: "lax";
  secure: boolean;
};

export function isMailCookieSecure(): boolean {
  if (typeof window !== "undefined") {
    return window.location.protocol === "https:";
  }

  return (
    process.env.NODE_ENV === "production" &&
    process.env.COOKIE_SECURE !== "false" &&
    process.env.COOKIE_SECURE !== "0"
  );
}

export function mailCookieOptions(maxAge: number): MailCookieWriteOptions {
  return {
    path: "/",
    maxAge,
    sameSite: "lax",
    secure: isMailCookieSecure(),
  };
}

export function mailCookieClearOptions(): MailCookieWriteOptions {
  return mailCookieOptions(0);
}

export function setMailClientCookie(
  name: string,
  value: string,
  maxAge: number,
): void {
  if (typeof document === "undefined") return;

  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
  ];
  if (isMailCookieSecure()) parts.push("Secure");
  document.cookie = parts.join("; ");
}

export function clearMailClientCookie(name: string): void {
  if (typeof document === "undefined") return;

  const parts = [`${name}=`, "Path=/", "Max-Age=0", "SameSite=Lax"];
  if (isMailCookieSecure()) parts.push("Secure");
  document.cookie = parts.join("; ");
}
