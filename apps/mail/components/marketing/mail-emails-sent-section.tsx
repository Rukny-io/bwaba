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
      className="flex items-center justify-center px-5 py-10 sm:px-8 sm:py-12"
      aria-label="Emails sent"
    >
      <AnimateNumber
        value={value}
        duration={900}
        className="text-5xl font-bold tracking-[-0.04em] text-[#062c30] sm:text-6xl md:text-7xl"
      />
    </div>
  );
}
