export function ComingSoonPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="flex h-full items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <p className="text-lg font-semibold text-[var(--foreground)]">{title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>
    </section>
  );
}
