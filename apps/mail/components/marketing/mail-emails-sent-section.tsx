"use client";

import { useEffect, useState } from "react";
import { AnimateNumber } from "@/components/ui/animated-blur-number";

export function MailEmailsSentSection({ emailsSent }: { emailsSent: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setValue(emailsSent));
    return () => window.cancelAnimationFrame(frame);
  }, [emailsSent]);

  return (
    <div
      className="flex items-center justify-center px-2 pt-3"
      aria-label={`${emailsSent.toLocaleString()} emails delivered`}
    >
      <AnimateNumber
        value={value}
        duration={900}
        className="text-5xl font-bold tracking-[-0.045em] text-[#111111] sm:text-6xl md:text-7xl"
      />
    </div>
  );
}
