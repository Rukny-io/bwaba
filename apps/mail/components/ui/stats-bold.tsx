type BoldStatsProps = {
  headline?: string;
  title?: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  stats?: { value: string; label: string }[];
};

const DEFAULT_STATS = [
  { value: "0.1ms", label: "P99 Latency" },
  { value: "142", label: "Global Regions" },
  { value: "24/7", label: "Human Support" },
] as const;

export function BoldStats({
  headline = "10B+",
  title = "API Calls Monthly",
  description = "Serving the world's most demanding applications with zero latency.",
  imageSrc = "https://images.unsplash.com/photo-1604076984203-587c92ab2e58?q=80&w=687&auto=format&fit=crop",
  imageAlt = "Abstract color field",
  stats = [...DEFAULT_STATS],
}: BoldStatsProps) {
  return (
    <section className="flex flex-col justify-center bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-5 py-16">
        <div className="items-center justify-between gap-8 border-b border-border pb-5 md:flex">
          <div className="flex flex-col items-baseline gap-4 md:flex-row">
            <span className="shrink-0 text-8xl font-medium tracking-tighter text-foreground lg:text-9xl">
              {headline}
            </span>
            <div className="max-w-xs">
              <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
              <p className="text-pretty text-sm text-muted">{description}</p>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={imageAlt}
            className="mt-6 h-52 w-full shrink-0 rounded-lg object-cover sm:w-96 md:mt-0"
          />
        </div>

        <div className="flex items-center justify-between gap-5">
          {stats.map((item) => (
            <div key={item.label}>
              <p className="mb-2 text-4xl font-medium tracking-tighter text-foreground md:text-5xl">
                {item.value}
              </p>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BoldStats;
