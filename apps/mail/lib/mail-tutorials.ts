export type MailTutorialCategoryId =
  | "setup"
  | "mailboxes"
  | "routing"
  | "deliverability"
  | "security"
  | "troubleshooting"
  | "billing";

export interface MailTutorialCategory {
  id: MailTutorialCategoryId;
  label: string;
  description: string;
}

export interface MailTutorialLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface MailTutorialGuide {
  id: string;
  category: MailTutorialCategoryId;
  title: string;
  summary: string;
  duration: string;
  steps: string[];
  links?: MailTutorialLink[];
  keywords?: string[];
}

export interface MailTutorialArticleSection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface MailTutorialArticle {
  slug: string;
  category: MailTutorialCategoryId;
  title: string;
  summary: string;
  duration: string;
  lastUpdated: string;
  sections: MailTutorialArticleSection[];
  relatedSlugs: string[];
  keywords?: string[];
}

export const MAIL_TUTORIAL_LAST_UPDATED = "August 2026";

export const MAIL_TUTORIAL_CATEGORIES: MailTutorialCategory[] = [
  {
    id: "setup",
    label: "Getting started",
    description: "Workspace, domain, and DNS verification",
  },
  {
    id: "mailboxes",
    label: "Mailboxes & webmail",
    description: "Create addresses and use Inbox",
  },
  {
    id: "routing",
    label: "Routing",
    description: "Forwarders, aliases, catch-all, auto-reply",
  },
  {
    id: "deliverability",
    label: "Deliverability",
    description: "Authentication, logs, and reputation",
  },
  {
    id: "security",
    label: "Security",
    description: "Mailbox passwords and two-factor auth",
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    description: "Fix DNS, login, and delivery issues",
  },
  {
    id: "billing",
    label: "Plans",
    description: "Limits, upgrades, and billing",
  },
];

export const MAIL_TUTORIAL_GUIDES: MailTutorialGuide[] = [
  {
    id: "launch-workspace",
    category: "setup",
    title: "Launch your workspace",
    summary: "Pick a workspace, connect your domain, and verify DNS.",
    duration: "5 min",
    steps: [
      "Sign in to Rukny and open Workspaces.",
      "Create or select a mail workspace.",
      "Add the domain you already own — you send as you@yourdomain, never @rukny.io.",
      "Copy the SPF, DKIM, and DMARC records from Domain settings into your DNS provider.",
      "Return to the console and run Verify. Status turns Active when records propagate.",
    ],
    links: [
      { label: "Workspaces", href: "/apps" },
      { label: "Dashboard", href: "/app" },
      { label: "Domain settings", href: "/domain" },
    ],
    keywords: ["domain", "dns", "spf", "dkim", "dmarc", "verify", "workspace"],
  },
  {
    id: "first-mailbox",
    category: "mailboxes",
    title: "Create your first mailbox",
    summary: "Add an address, set a password, and sign in to webmail.",
    duration: "3 min",
    steps: [
      "Open Mailboxes after your domain is verified.",
      "Create a local part (for example hello) — the full address becomes hello@yourdomain.",
      "Set a mailbox password. This is separate from your Rukny account password.",
      "Optional: enable TOTP for the mailbox before it is required.",
      "Open Inbox and sign in with the mailbox address and password.",
    ],
    links: [
      { label: "Mailboxes", href: "/mailboxes" },
      { label: "Inbox", href: "/inbox" },
    ],
    keywords: ["mailbox", "password", "webmail", "inbox", "create"],
  },
  {
    id: "send-from-webmail",
    category: "mailboxes",
    title: "Send from webmail",
    summary: "Compose, reply, and keep delivery on your domain.",
    duration: "2 min",
    steps: [
      "Open Inbox and select the mailbox you want to use.",
      "Click Compose, write your message, and send — From stays on your domain.",
      "Replies stay in the same mailbox thread inside webmail.",
      "If delivery fails, check Email Logs for the event (message contents stay in Inbox).",
    ],
    links: [
      { label: "Inbox", href: "/inbox" },
      { label: "Email Logs", href: "/logs" },
    ],
    keywords: ["send", "compose", "reply", "webmail", "outbound"],
  },
  {
    id: "route-mail",
    category: "routing",
    title: "Route incoming mail",
    summary: "Forwarders, aliases, catch-all, and vacation replies.",
    duration: "4 min",
    steps: [
      "Forwarders: copy mail from one mailbox address to an external inbox (for example Gmail).",
      "Aliases: add extra addresses (sales@, support@) that deliver to an existing mailbox inside Rukny.",
      "Catch-all: send unmatched addresses on your domain to one mailbox.",
      "Automatic Reply: turn on a vacation message with optional start and end dates.",
    ],
    links: [
      { label: "Forwarders", href: "/forwarders" },
      { label: "Email Alias", href: "/aliases" },
      { label: "Catch-all", href: "/catch-all" },
      { label: "Automatic Reply", href: "/auto-reply" },
    ],
    keywords: ["forward", "alias", "catch-all", "auto-reply", "vacation", "routing"],
  },
  {
    id: "forwarder-vs-alias",
    category: "routing",
    title: "Forwarder vs alias — which to use",
    summary: "Two routing tools with different destinations.",
    duration: "2 min",
    steps: [
      "Use a forwarder when mail should leave Rukny to an external address.",
      "Use an alias when you want another address@yourdomain that lands in an existing Rukny mailbox.",
      "Aliases keep everything inside webmail; forwarders are for backup or personal inboxes elsewhere.",
      "You can combine both: alias for team addresses, forwarder for a founder’s Gmail backup.",
    ],
    links: [
      { label: "Forwarders", href: "/forwarders" },
      { label: "Email Alias", href: "/aliases" },
    ],
    keywords: ["forward", "alias", "difference", "routing"],
  },
  {
    id: "dns-records",
    category: "deliverability",
    title: "SPF, DKIM, and DMARC",
    summary: "The three records that authenticate mail from your domain.",
    duration: "4 min",
    steps: [
      "SPF tells receivers which servers may send mail for your domain.",
      "DKIM adds a cryptographic signature so receivers can verify messages were not altered.",
      "DMARC tells providers what to do when SPF or DKIM fail — start with monitoring, then tighten policy.",
      "Copy all three from Domain settings. Keep them DNS-only — no proxy if your DNS provider offers orange-cloud mode.",
      "Propagation can take minutes to 48 hours depending on your DNS host.",
    ],
    links: [{ label: "Domain settings", href: "/domain" }],
    keywords: ["spf", "dkim", "dmarc", "dns", "authentication"],
  },
  {
    id: "monitor-delivery",
    category: "deliverability",
    title: "Monitor delivery with Email Logs",
    summary: "Confirm sends, spot failures, and keep authentication healthy.",
    duration: "3 min",
    steps: [
      "Open Email Logs to see sent, received, queued, and failed events.",
      "Filter by mailbox, direction, status, or search by subject and addresses.",
      "Logs show delivery metadata only — full message bodies stay in Inbox.",
      "If mail bounces, re-check SPF, DKIM, and DMARC in Domain settings.",
      "Reputation still depends on what you send — authentication alone is not enough.",
    ],
    links: [
      { label: "Email Logs", href: "/logs" },
      { label: "Domain settings", href: "/domain" },
    ],
    keywords: ["logs", "delivery", "bounce", "failed", "spf", "reputation"],
  },
  {
    id: "plans-and-limits",
    category: "billing",
    title: "Plans and limits",
    summary: "Starter starts after DNS; higher tiers unlock more capacity.",
    duration: "2 min",
    steps: [
      "Starter activates automatically once your domain DNS is verified.",
      "Standard and Premium are requested from Pricing and enabled by an admin.",
      "Settings shows your current plan, storage, and mailbox limits for this workspace.",
      "Need more mailboxes or storage? Upgrade from Pricing, then check Settings.",
    ],
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Settings", href: "/settings" },
    ],
    keywords: ["plan", "pricing", "starter", "standard", "premium", "limits", "iqd"],
  },
  {
    id: "fix-dns-verification",
    category: "setup",
    title: "Fix DNS verification",
    summary: "When domain status stays Pending or Failed after adding records.",
    duration: "4 min",
    steps: [
      "Open Domain settings and compare each record with your DNS panel — typos in host or value are the most common issue.",
      "Use DNS-only mode if your provider proxies records (for example Cloudflare orange cloud). Mail records must not be proxied.",
      "Wait for TTL to expire — some providers take up to 48 hours to propagate worldwide.",
      "Remove old SPF or DKIM records from a previous email provider before adding Rukny’s values.",
      "Run Verify again after each fix. Status moves to Active only when all required records match.",
    ],
    links: [{ label: "Domain settings", href: "/domain" }],
    keywords: ["dns", "verify", "pending", "failed", "propagation", "cloudflare"],
  },
  {
    id: "workspace-slots",
    category: "setup",
    title: "Workspaces and /u0 URLs",
    summary: "Why console links look like /u0/inbox and how to switch workspaces.",
    duration: "2 min",
    steps: [
      "Each mail workspace gets a stable slot: /u0, /u1, and so on.",
      "Bookmarks to /u0/inbox always open the same workspace after sign-in.",
      "Open Workspaces to switch between mail apps you own or were invited to.",
      "Tutorials and pricing stay at public URLs without a slot prefix.",
    ],
    links: [
      { label: "Workspaces", href: "/apps" },
      { label: "Dashboard", href: "/app" },
    ],
    keywords: ["workspace", "slot", "u0", "url", "switch"],
  },
  {
    id: "add-team-mailboxes",
    category: "mailboxes",
    title: "Add mailboxes for your team",
    summary: "Give each person an address@yourdomain with their own password.",
    duration: "3 min",
    steps: [
      "Check your plan in Settings — Starter includes one mailbox; higher tiers include more.",
      "Open Mailboxes and create a local part per person (for example sara, support, billing).",
      "Set a unique password per mailbox. Share credentials securely — not over plain email.",
      "Optional: enable 2FA on sensitive mailboxes from the mailbox menu.",
      "Each teammate signs in to Inbox with their own address and password.",
    ],
    links: [
      { label: "Mailboxes", href: "/mailboxes" },
      { label: "Settings", href: "/settings" },
      { label: "Inbox", href: "/inbox" },
    ],
    keywords: ["team", "multiple", "mailbox", "seats", "create"],
  },
  {
    id: "sign-in-to-inbox",
    category: "mailboxes",
    title: "Sign in to webmail (Inbox)",
    summary: "Use your mailbox address — not your Rukny account — inside Inbox.",
    duration: "2 min",
    steps: [
      "Open Inbox from the sidebar after your domain is Active.",
      "Enter the full mailbox address (hello@yourdomain.com) and the mailbox password.",
      "If 2FA is enabled, enter the 6-digit code from your authenticator app.",
      "Switch mailboxes from the inbox switcher without signing out of Rukny.",
      "Your Rukny account password only opens the console — it does not open webmail.",
    ],
    links: [{ label: "Inbox", href: "/inbox" }],
    keywords: ["login", "webmail", "inbox", "password", "sign in"],
  },
  {
    id: "set-up-forwarder",
    category: "routing",
    title: "Set up an email forwarder",
    summary: "Send a copy of incoming mail to Gmail or another external inbox.",
    duration: "3 min",
    steps: [
      "Open Forwarders in the console.",
      "Choose the source mailbox address on your domain.",
      "Enter the external destination address (for example your@gmail.com).",
      "Save and send a test message to the source address.",
      "Check the destination inbox — allow a minute for delivery.",
    ],
    links: [{ label: "Forwarders", href: "/forwarders" }],
    keywords: ["forward", "forwarder", "gmail", "external", "copy"],
  },
  {
    id: "set-up-email-alias",
    category: "routing",
    title: "Set up an email alias",
    summary: "Add sales@ or support@ that delivers into an existing mailbox.",
    duration: "3 min",
    steps: [
      "Open Email Alias in the console.",
      "Pick the mailbox that should receive messages.",
      "Create the alias local part (for example sales) — it becomes sales@yourdomain.",
      "Send a test to the alias address and confirm it appears in the target mailbox Inbox.",
      "Alias limits depend on your plan — check Settings if you hit the cap.",
    ],
    links: [
      { label: "Email Alias", href: "/aliases" },
      { label: "Settings", href: "/settings" },
    ],
    keywords: ["alias", "sales", "support", "address"],
  },
  {
    id: "set-up-catch-all",
    category: "routing",
    title: "Set up catch-all email",
    summary: "Route any unmatched address@yourdomain to one mailbox.",
    duration: "2 min",
    steps: [
      "Open Catch-all email in the console.",
      "Choose the destination mailbox for unmatched addresses.",
      "Enable catch-all and save.",
      "Test with a random address you never created (for example random-test@yourdomain).",
      "Disable catch-all if you receive too much spam to random addresses.",
    ],
    links: [{ label: "Catch-all", href: "/catch-all" }],
    keywords: ["catch-all", "wildcard", "spam", "unmatched"],
  },
  {
    id: "set-up-automatic-reply",
    category: "routing",
    title: "Set up an automatic reply",
    summary: "Turn on a vacation or out-of-office message with optional dates.",
    duration: "3 min",
    steps: [
      "Open Automatic Reply in the console.",
      "Select the mailbox that should send the auto-reply.",
      "Write the message visitors receive when they email you.",
      "Optional: set start and end dates so the reply turns off automatically.",
      "Send yourself a test from another address to confirm the reply fires once.",
    ],
    links: [{ label: "Automatic Reply", href: "/auto-reply" }],
    keywords: ["auto-reply", "vacation", "out of office", "ooo"],
  },
  {
    id: "avoid-spam-folder",
    category: "deliverability",
    title: "Keep mail out of spam",
    summary: "Authentication plus sending habits that protect reputation.",
    duration: "4 min",
    steps: [
      "Confirm SPF, DKIM, and DMARC all pass in Domain settings before sending volume.",
      "Warm up a new domain — start with low volume to people who expect your mail.",
      "Avoid spam triggers: ALL CAPS subjects, misleading From names, and link-only bodies.",
      "Use a real reply-to address and include plain-text content alongside HTML.",
      "Check Email Logs for bounces and complaints — stop sending to addresses that hard-bounce.",
    ],
    links: [
      { label: "Domain settings", href: "/domain" },
      { label: "Email Logs", href: "/logs" },
    ],
    keywords: ["spam", "reputation", "warmup", "inbox placement"],
  },
  {
    id: "read-failed-logs",
    category: "deliverability",
    title: "Understand failed sends in Email Logs",
    summary: "What Failed and Queued mean — and what to do next.",
    duration: "3 min",
    steps: [
      "Open Email Logs and filter Status to Failed.",
      "Failed outbound usually means the recipient server rejected the message — check the address or authentication.",
      "Queued means the message is still retrying — wait a few minutes before investigating.",
      "Search by subject or recipient to find a specific attempt.",
      "Cross-check Domain settings if failures started right after a DNS change.",
    ],
    links: [{ label: "Email Logs", href: "/logs" }],
    keywords: ["failed", "queued", "bounce", "logs", "status"],
  },
  {
    id: "enable-mailbox-2fa",
    category: "security",
    title: "Enable mailbox two-factor auth (2FA)",
    summary: "Protect webmail with TOTP from Google Authenticator or Authy.",
    duration: "3 min",
    steps: [
      "Open Mailboxes and find the mailbox you want to protect.",
      "Open the mailbox menu and choose Enable 2FA (or enable during creation).",
      "Scan the QR code with your authenticator app and enter the 6-digit code to confirm.",
      "Store backup access safely — you will need the app code every time you open Inbox.",
      "To sign in: mailbox address, password, then the current TOTP code.",
    ],
    links: [{ label: "Mailboxes", href: "/mailboxes" }],
    keywords: ["2fa", "totp", "authenticator", "security", "qr"],
  },
  {
    id: "mailbox-password-basics",
    category: "security",
    title: "Mailbox password vs Rukny account",
    summary: "Two separate logins — console and webmail.",
    duration: "2 min",
    steps: [
      "Your Rukny account (email + OAuth) opens Workspaces, Domain settings, and Mailboxes.",
      "Each mailbox has its own password used only for Inbox webmail.",
      "Changing your Rukny password does not change mailbox passwords.",
      "Use a strong unique password per mailbox; enable 2FA on shared team inboxes.",
      "Reset or rotate mailbox passwords from Mailboxes when someone leaves the team.",
    ],
    links: [
      { label: "Mailboxes", href: "/mailboxes" },
      { label: "Inbox", href: "/inbox" },
    ],
    keywords: ["password", "account", "webmail", "security", "login"],
  },
  {
    id: "troubleshoot-webmail-login",
    category: "troubleshooting",
    title: "Can't sign in to Inbox",
    summary: "Fix wrong password, 2FA, or inactive domain issues.",
    duration: "3 min",
    steps: [
      "Use the full mailbox address (name@yourdomain.com), not your Rukny account email.",
      "Confirm the domain is Active in Domain settings — Inbox requires verified DNS.",
      "If 2FA is on, enter a fresh code from your authenticator (codes expire every 30 seconds).",
      "Reset the mailbox password from Mailboxes if the password was lost.",
      "Clear browser cache or try a private window if the session looks stuck.",
    ],
    links: [
      { label: "Inbox", href: "/inbox" },
      { label: "Mailboxes", href: "/mailboxes" },
      { label: "Domain settings", href: "/domain" },
    ],
    keywords: ["login", "password", "2fa", "stuck", "webmail", "error"],
  },
  {
    id: "mail-not-arriving",
    category: "troubleshooting",
    title: "Sent mail not arriving",
    summary: "When recipients do not get your message — or you see Failed in logs.",
    duration: "4 min",
    steps: [
      "Check Email Logs for the send attempt — look for Sent vs Failed.",
      "Ask the recipient to check spam — new domains often land there at first.",
      "Verify the recipient address has no typos.",
      "Confirm SPF, DKIM, and DMARC still pass in Domain settings.",
      "Reduce volume temporarily if you recently started sending from a new domain.",
    ],
    links: [
      { label: "Email Logs", href: "/logs" },
      { label: "Domain settings", href: "/domain" },
    ],
    keywords: ["not arriving", "missing", "failed", "recipient", "delivery"],
  },
  {
    id: "incoming-mail-missing",
    category: "troubleshooting",
    title: "Incoming mail not showing in Inbox",
    summary: "When senders say they emailed you but nothing appears.",
    duration: "3 min",
    steps: [
      "Confirm they used the correct address — typos in the local part are common.",
      "If you use forwarders, check the destination inbox too.",
      "Look in Email Logs for Received events — if logged but not in Inbox, refresh webmail.",
      "Catch-all must be enabled to receive mail to addresses you never created.",
      "Verify MX records point to Rukny if you migrated from another provider recently.",
    ],
    links: [
      { label: "Inbox", href: "/inbox" },
      { label: "Email Logs", href: "/logs" },
      { label: "Domain settings", href: "/domain" },
    ],
    keywords: ["incoming", "receive", "missing", "mx", "not showing"],
  },
  {
    id: "plan-limits-explained",
    category: "billing",
    title: "Understand plan limits",
    summary: "Mailboxes, storage, aliases, and forwarders per tier.",
    duration: "3 min",
    steps: [
      "Starter: one mailbox, 5 GB storage, limited aliases and forwarders — activates after DNS verification.",
      "Standard and Premium add more mailboxes, storage, and routing headroom.",
      "Open Settings to see live usage for your workspace.",
      "Hit a limit? Request an upgrade from Pricing — admins activate higher tiers.",
      "Extra mailboxes on paid tiers may have a per-seat monthly add-on (see Pricing).",
    ],
    links: [
      { label: "Settings", href: "/settings" },
      { label: "Pricing", href: "/pricing" },
    ],
    keywords: ["limits", "storage", "mailboxes", "aliases", "starter", "standard"],
  },
];

const RELATED_BY_CATEGORY: Record<MailTutorialCategoryId, string[]> = {
  setup: ["fix-dns-verification", "first-mailbox", "launch-workspace"],
  mailboxes: ["sign-in-to-inbox", "add-team-mailboxes", "send-from-webmail"],
  routing: ["forwarder-vs-alias", "set-up-forwarder", "set-up-email-alias"],
  deliverability: ["dns-records", "avoid-spam-folder", "monitor-delivery"],
  security: ["enable-mailbox-2fa", "mailbox-password-basics", "sign-in-to-inbox"],
  troubleshooting: ["troubleshoot-webmail-login", "mail-not-arriving", "fix-dns-verification"],
  billing: ["plan-limits-explained", "plans-and-limits", "add-team-mailboxes"],
};

function guideToArticle(guide: MailTutorialGuide): MailTutorialArticle {
  const related = (RELATED_BY_CATEGORY[guide.category] ?? [])
    .filter((slug) => slug !== guide.id)
    .slice(0, 3);

  const consoleBullets =
    guide.links?.map((link) => `${link.label} — open after sign-in in the console.`) ?? [];

  return {
    slug: guide.id,
    category: guide.category,
    title: guide.title,
    summary: guide.summary,
    duration: guide.duration,
    lastUpdated: MAIL_TUTORIAL_LAST_UPDATED,
    keywords: guide.keywords,
    relatedSlugs: related,
    sections: [
      {
        id: "overview",
        title: "Overview",
        paragraphs: [
          guide.summary,
          "These steps assume you already own the domain you want to send from. Rukny Mail runs on Amazon SES — you manage everything from the Rukny console, not the AWS dashboard.",
        ],
      },
      {
        id: "steps",
        title: "Step by step",
        bullets: guide.steps,
      },
      ...(consoleBullets.length
        ? [
            {
              id: "console",
              title: "Open in the console",
              paragraphs: [
                "Sign in to Rukny to apply these steps in your workspace. Console links below require an active mail workspace.",
              ],
              bullets: consoleBullets,
            } satisfies MailTutorialArticleSection,
          ]
        : []),
      {
        id: "tips",
        title: "Tips",
        bullets: [
          "DNS changes can take time — wait for propagation before opening a deliverability ticket.",
          "Each mailbox has its own password, separate from your Rukny account.",
          "Email Logs show delivery events; Inbox holds full messages.",
        ],
      },
    ],
  };
}

export const MAIL_TUTORIAL_ARTICLES: MailTutorialArticle[] =
  MAIL_TUTORIAL_GUIDES.map(guideToArticle);

export function getMailTutorialArticle(slug: string) {
  return MAIL_TUTORIAL_ARTICLES.find((article) => article.slug === slug) ?? null;
}

export function getMailTutorialCategory(id: MailTutorialCategoryId) {
  return MAIL_TUTORIAL_CATEGORIES.find((category) => category.id === id) ?? null;
}

export function listMailTutorialArticlesByCategory() {
  return MAIL_TUTORIAL_CATEGORIES.map((category) => ({
    category,
    articles: MAIL_TUTORIAL_ARTICLES.filter(
      (article) => article.category === category.id,
    ),
  })).filter((group) => group.articles.length > 0);
}

export function filterMailTutorialArticles(
  query: string,
  category: MailTutorialCategoryId | "all" = "all",
) {
  const q = query.trim().toLowerCase();
  return MAIL_TUTORIAL_ARTICLES.filter((article) => {
    if (category !== "all" && article.category !== category) return false;
    if (!q) return true;
    const haystack = [
      article.title,
      article.summary,
      article.duration,
      ...(article.keywords ?? []),
      ...article.sections.flatMap((section) => [
        section.title,
        ...(section.paragraphs ?? []),
        ...(section.bullets ?? []),
      ]),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
