"use client";

import LogoCloudSwap, { type LogoEntry } from "@/components/ui/logo-clouds";

const LOGO_IMG_CLASS =
  "pointer-events-none mx-auto h-8 w-auto max-h-8 max-w-[5.25rem] select-none object-contain object-center opacity-70 grayscale transition-[opacity,filter] duration-300 hover:opacity-100 hover:grayscale-0 sm:h-9 sm:max-h-9 sm:max-w-[5.75rem]";

function BrandLogo({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={92}
      height={36}
      loading="lazy"
      draggable={false}
      className={LOGO_IMG_CLASS}
    />
  );
}

const RUKNY_PROVIDER_LOGOS: LogoEntry[] = [
  { id: "aws", name: "AWS", icon: <BrandLogo src="/logos/aws.svg" /> },
  {
    id: "google-cloud",
    name: "Google Cloud",
    icon: <BrandLogo src="/logos/google-cloud.svg" />,
  },
  {
    id: "microsoft",
    name: "Microsoft",
    icon: <BrandLogo src="/logos/microsoft.svg" />,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: <BrandLogo src="/logos/chatgpt.svg" />,
  },
  {
    id: "notion",
    name: "Notion",
    icon: <BrandLogo src="/logos/notion-full.svg" />,
  },
];

export function MailAgLogoCloud() {
  return (
    <LogoCloudSwap
      logos={RUKNY_PROVIDER_LOGOS}
      title="Works with the tools your team already uses"
      subtitle="Cloud infrastructure, productivity apps, and AI assistants — connected to your domain email."
      interval={4200}
      stagger={0.09}
      className="border-t border-[#E8E8E8] bg-white py-16 sm:py-20 [&_h2]:text-balance [&_h2]:text-[clamp(1.5rem,3vw,1.875rem)] [&_h2]:font-medium [&_h2]:tracking-[0] [&_h2]:text-[#1D1D1D] [&_p]:mx-auto [&_p]:max-w-xl [&_p]:text-[#6B6F76]"
    />
  );
}
