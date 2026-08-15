'use client';

import {
  BarChart3,
  BrainCircuit,
  ClipboardList,
  Code2,
  Link2,
  ShoppingBag,
  Sparkles,
  Store,
  Terminal,
  UserCircle2,
  Zap,
  type LucideIcon,
} from 'lucide-react';

type FloatingIcon = {
  icon: LucideIcon;
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
  opacity: number;
};

const icons: FloatingIcon[] = [
  { icon: ShoppingBag, top: '12%', left: '8%', size: 22, delay: '0s', duration: '7s', opacity: 0.35 },
  { icon: ClipboardList, top: '22%', left: '78%', size: 26, delay: '1s', duration: '8s', opacity: 0.4 },
  { icon: UserCircle2, top: '58%', left: '6%', size: 24, delay: '0.5s', duration: '9s', opacity: 0.3 },
  { icon: BarChart3, top: '68%', left: '85%', size: 28, delay: '1.5s', duration: '7.5s', opacity: 0.35 },
  { icon: Sparkles, top: '38%', left: '92%', size: 20, delay: '0.2s', duration: '6.5s', opacity: 0.45 },
  { icon: Store, top: '78%', left: '42%', size: 22, delay: '2s', duration: '8.5s', opacity: 0.25 },
  { icon: Code2, top: '15%', left: '48%', size: 20, delay: '0.8s', duration: '7.2s', opacity: 0.3 },
  { icon: Terminal, top: '48%', left: '22%', size: 22, delay: '1.2s', duration: '9.2s', opacity: 0.28 },
  { icon: Link2, top: '32%', left: '62%', size: 18, delay: '0.4s', duration: '6.8s', opacity: 0.32 },
  { icon: BrainCircuit, top: '82%', left: '68%', size: 24, delay: '1.8s', duration: '8s', opacity: 0.3 },
  { icon: Zap, top: '6%', left: '88%', size: 18, delay: '0.6s', duration: '7s', opacity: 0.4 },
];

export function HeroFloatingIcons() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {icons.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className="antigravity-float-icon absolute flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/50 backdrop-blur-md"
            style={{
              top: item.top,
              left: item.left,
              width: item.size + 20,
              height: item.size + 20,
              opacity: item.opacity,
              animationDelay: item.delay,
              animationDuration: item.duration,
            }}
          >
            <Icon size={item.size} strokeWidth={1.5} />
          </div>
        );
      })}
    </div>
  );
}
