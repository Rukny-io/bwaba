import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { cn } from "@/lib/utils";

type Logo = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

type LogoCloudProps = React.ComponentProps<"div"> & {
  logos: Logo[];
};

export function LogoCloud({ className, logos, ...props }: LogoCloudProps) {
  const safeLogos = logos.filter((logo) => Boolean(logo?.src));
  const minItemsPerTrack = 10;
  const repeatedLogos =
    safeLogos.length > 0
      ? Array.from({ length: Math.ceil(minItemsPerTrack / safeLogos.length) }).flatMap(
          () => safeLogos
        )
      : safeLogos;

  return (
    <div
      {...props}
      dir="ltr"
      className={cn('overflow-hidden py-1', className)}
    >
      <InfiniteSlider gap={48} duration={38}>
        {repeatedLogos.map((logo, index) => (
          <div
            key={`logo-${logo.alt}-${index}`}
            className="flex h-12 w-[128px] shrink-0 items-center justify-center px-2 sm:h-14 sm:w-[148px]"
          >
            <img
              alt={logo.alt}
              className="pointer-events-none h-6 w-auto max-w-full select-none object-contain opacity-90 sm:h-7"
              height={logo.height ?? 28}
              loading="lazy"
              src={logo.src}
              width={logo.width ?? 112}
            />
          </div>
        ))}
      </InfiniteSlider>
    </div>
  );
}
