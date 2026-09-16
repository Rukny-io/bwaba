"use client";

import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

const PROVIDERS = [
  { src: "/logos/aws.svg", alt: "Amazon Web Services" },
  { src: "/logos/google-cloud.svg", alt: "Google Cloud" },
  { src: "/logos/microsoft.svg", alt: "Microsoft" },
  { src: "/logos/google-wordmark.svg", alt: "Google" },
  { src: "/logos/notion-full.svg", alt: "Notion" },
] as const;

/** Repeat until one track is wider than typical marketing containers. */
const MIN_ITEMS_PER_TRACK = 14;
const TRACK_COPIES = 3;
const GAP_PX = 48;

const TRACK_LOGOS = Array.from(
  { length: Math.ceil(MIN_ITEMS_PER_TRACK / PROVIDERS.length) },
  () => PROVIDERS,
).flat();

function ProviderTrack({ trackIndex }: { trackIndex: number }) {
  return (
    <div
      className="mail-marquee-group flex shrink-0 items-center"
      style={{ gap: GAP_PX, paddingInlineEnd: GAP_PX }}
      aria-hidden={trackIndex > 0 ? true : undefined}
    >
      {TRACK_LOGOS.map((logo, index) => (
        <div
          key={`${trackIndex}-${logo.alt}-${index}`}
          className="mail-marquee-logo flex h-20 w-[7.5rem] shrink-0 items-center justify-center sm:w-[8.5rem]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.src}
            alt=""
            width={112}
            height={28}
            loading="lazy"
            draggable={false}
            className="pointer-events-none h-6 w-auto max-w-full select-none object-contain opacity-55 grayscale transition-[opacity,filter,transform] duration-300 sm:h-7"
          />
        </div>
      ))}
    </div>
  );
}

export function MailProvidersMarquee() {
  const providerNames = PROVIDERS.map((p) => p.alt).join(", ");

  return (
    <section
      className="border-b border-[#e8e8e8]"
      aria-label={providerNames}
    >
      <div className={L.container}>
        <div className="mail-marquee-shell border-x border-[#e8e8e8] bg-[#fafafa] bg-[radial-gradient(circle,_#b9d4d2_0.55px,_transparent_0.55px)] bg-[length:4.75px_4.75px]">
          <div className="relative overflow-hidden" dir="ltr">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#fafafa] to-transparent sm:w-16"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#fafafa] to-transparent sm:w-16"
            />

            <div className="mail-marquee-track" aria-hidden>
              {Array.from({ length: TRACK_COPIES }, (_, trackIndex) => (
                <ProviderTrack key={trackIndex} trackIndex={trackIndex} />
              ))}
            </div>

            <ul className="mail-marquee-static flex flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 py-5">
              {PROVIDERS.map((logo) => (
                <li
                  key={logo.alt}
                  className="flex h-10 w-[7.5rem] items-center justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    width={112}
                    height={28}
                    loading="lazy"
                    className="h-6 w-auto max-w-full object-contain opacity-55 grayscale"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
