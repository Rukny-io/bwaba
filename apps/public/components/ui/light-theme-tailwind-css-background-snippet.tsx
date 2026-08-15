import { cn } from '@/lib/utils';

type RadialBackgroundProps = {
  className?: string;
  /** Outer edge color for the radial glow. Defaults to Rukny brand teal. */
  edgeColor?: string;
  fixed?: boolean;
};

export function RadialBackground({
  className,
  edgeColor,
  fixed = true,
}: RadialBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none -z-10 size-full bg-white',
        fixed ? 'fixed inset-0' : 'absolute inset-0',
        className,
      )}
      style={{
        background: edgeColor
          ? `radial-gradient(125% 125% at 50% 10%, #fff 40%, ${edgeColor} 100%)`
          : 'var(--site-radial-bg)',
      }}
    />
  );
}
