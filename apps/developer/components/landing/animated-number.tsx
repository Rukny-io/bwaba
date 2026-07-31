'use client';

const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

function Digit({ value }: { value: number }) {
  return (
    <span
      aria-hidden
      className="relative inline-block h-[1em] w-[1ch] overflow-hidden align-baseline"
    >
      <span
        className="flex flex-col"
        style={{
          transform: `translateY(-${value}em)`,
          transition: `transform 0.7s ${EASE}`,
          willChange: 'transform',
        }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="flex h-[1em] items-center justify-center leading-[1em]"
          >
            {i}
          </span>
        ))}
      </span>
    </span>
  );
}

export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const chars = value.toLocaleString('en-US').split('');
  return (
    <span
      dir="ltr"
      className={`inline-flex items-end tabular-nums ${className ?? ''}`}
      aria-label={value.toLocaleString('en-US')}
    >
      {chars.map((ch, i) =>
        /\d/.test(ch) ? (
          <Digit key={i} value={Number(ch)} />
        ) : (
          <span key={i} aria-hidden className="inline-block">
            {ch}
          </span>
        ),
      )}
    </span>
  );
}
