"use client";

import {
  BookOpen,
  Globe,
  Inbox,
  Mail,
  MessageSquareText,
  Send,
  Shield,
  Terminal,
} from "lucide-react";
import CommunityOrbit, {
  type OrbitItem,
  type OrbitStat,
  type OrbitTag,
} from "@/components/ui/builders-community-hero";
import { resolveDeveloperUrl } from "@rukny/auth/client/env-urls";

/** Illustrated customer avatars — decorative, not real users. */
const customerAvatar = (id: number) =>
  `https://raw.githubusercontent.com/alohe/memojis/main/png/memo_${id}.png`;

function CustomerChip({ id }: { id: number }) {
  return (
    <span className="flex h-[22px] w-[22px] items-center justify-center overflow-hidden rounded-full bg-[#E8EEF9]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={customerAvatar(id)}
        alt=""
        draggable={false}
        className="h-full w-full translate-y-[8%] scale-[1.1] object-cover object-top"
      />
    </span>
  );
}

const ORBIT_ITEMS: OrbitItem[] = [
  { kind: "status", ring: "outer", angle: 132, label: "Domain verified" },
  { kind: "card", ring: "outer", angle: 112.6, emoji: "✉️", badge: "99" },
  {
    kind: "pill",
    ring: "outer",
    angle: 90,
    icon: <CustomerChip id={33} />,
    label: "Team inbox",
  },
  {
    kind: "pill",
    ring: "outer",
    angle: 67.6,
    icon: <Shield size={13} strokeWidth={2} aria-hidden />,
    label: "Authenticated",
  },
  {
    kind: "avatar",
    ring: "outer",
    angle: 50.9,
    src: customerAvatar(9),
    alt: "",
    color: "#E8EEF9",
  },
  {
    kind: "pill",
    ring: "outer",
    angle: 35.2,
    icon: <MessageSquareText size={13} strokeWidth={2} aria-hidden />,
    label: "36 threads",
  },
  {
    kind: "avatar",
    ring: "inner",
    angle: 137.2,
    src: customerAvatar(19),
    alt: "",
    color: "#F5EDE3",
  },
  {
    kind: "pill",
    ring: "inner",
    angle: 116.6,
    icon: <Inbox size={13} strokeWidth={2} aria-hidden />,
    label: "Inbox live",
  },
  {
    kind: "avatar",
    ring: "inner",
    angle: 90,
    src: customerAvatar(35),
    alt: "",
    color: "#E8EEF9",
    size: 48,
  },
  {
    kind: "pill",
    ring: "inner",
    angle: 63.3,
    icon: <Send size={13} strokeWidth={2} aria-hidden />,
    label: "Delivered",
  },
  { kind: "check", ring: "inner", angle: 41.8 },
];

const ORBIT_STATS: OrbitStat[] = [
  { value: "50+", label: "Domains" },
  { value: "10K+", label: "Messages / day" },
  { value: "99.9%", label: "Uptime" },
];

export function MailAgCommunityOrbit() {
  const developer = resolveDeveloperUrl();

  const tags: OrbitTag[] = [
    {
      icon: <Globe strokeWidth={1.75} aria-hidden />,
      label: "Getting started",
      href: "/getting-started",
      variant: "primary",
    },
    {
      icon: <BookOpen strokeWidth={1.75} aria-hidden />,
      label: "Documentation",
      href: "/documents",
    },
    {
      icon: <Terminal strokeWidth={1.75} aria-hidden />,
      label: "Email API",
      href: `${developer}/documentation/email-api`,
      external: true,
    },
    {
      icon: <Mail strokeWidth={1.75} aria-hidden />,
      label: "Pricing",
      href: "/pricing",
    },
  ];

  return (
    <CommunityOrbit
      items={ORBIT_ITEMS}
      stats={ORBIT_STATS}
      headline={
        <>
          Mail that fits how
          <br className="hidden sm:block" />
          your team already works
        </>
      }
      tags={tags}
      className="border-t border-[#E8E8E8] pt-6 sm:pt-10"
    />
  );
}
