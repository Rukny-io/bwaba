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
    <div className="relative overflow-hidden px-5 py-8 sm:px-8 sm:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 top-0 size-40 rounded-full bg-[#D2D6EF]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 bottom-0 size-36 rounded-full bg-[#EEF2F2]/90 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-md">
          <p className="mb-1 font-mono text-[10px] tracking-wide text-[#132327]/45">
            05
          </p>
          <h3 className="text-[15px] font-semibold text-[#132327] sm:text-base">
            Emails sent
          </h3>
          <p className="mt-1.5 text-[13px] leading-[1.75] text-[#132327]/55 sm:text-[14px]">
            Outbound mail delivered through Rukny Mail.
          </p>
        </div>
        <p className="m-0">
          <AnimateNumber
            value={value}
            duration={900}
            className="text-5xl font-bold tracking-[-0.04em] text-[#062c30] sm:text-6xl md:text-7xl"
          />
        </p>
      </div>
    </div>
  );
}
