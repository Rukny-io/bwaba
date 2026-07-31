'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const STACK_LAYERS = [
  {
    zIndex: 0,
    transform: 'none',
    content: (
      <div className="flex size-full items-center justify-center bg-[var(--surface)] p-4 min-[720px]:p-5">
        <Image
          src="/rukny-logo.svg"
          alt="شعار ركني"
          width={492}
          height={492}
          priority
          className="size-full object-contain"
        />
      </div>
    ),
  }
] as const;

export function AppLogoStack() {
  return (
    <motion.ul
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="relative isolate size-20 min-[720px]:size-[88px]"
    >
      {STACK_LAYERS.map((layer, index) => (
        <li
          key={index}
          className="absolute inset-0 overflow-hidden rounded-2xl min-[720px]:rounded-3xl"
          style={{
            transformOrigin: 'center top',
            zIndex: layer.zIndex,
            transform: layer.transform,
          }}
        >
          <div className="relative size-full shrink-0 overflow-hidden shadow-[var(--card-shadow)] ring-1 ring-[var(--border)]">
            {layer.content}
          </div>
        </li>
      ))}
    </motion.ul>
  );
}
