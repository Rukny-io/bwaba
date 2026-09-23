"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { motion } from "framer-motion";
import { agLayout } from "@/lib/mail-antigravity-theme";

function detectPlatform(): "linux" | "mac" | "windows" | "web" {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() ?? "";
  if (platform.includes("linux") || ua.includes("linux")) return "linux";
  if (platform.includes("mac") || ua.includes("mac")) return "mac";
  if (platform.includes("win") || ua.includes("windows")) return "windows";
  return "web";
}

const PLATFORM_LABEL: Record<
  ReturnType<typeof detectPlatform>,
  string
> = {
  linux: "Linux",
  mac: "macOS",
  windows: "Windows",
  web: "your browser",
};

export function MailAgDownloadBand({
  primaryHref,
  primaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
}) {
  const [platform, setPlatform] = useState<ReturnType<typeof detectPlatform>>(
    "web",
  );

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const platformName = PLATFORM_LABEL[platform];

  return (
    <section
      className="download-section relative border-t border-[#E8E8E8] bg-white"
      aria-label="Get started"
    >
      <div
        className={`download-section-content ${agLayout.container} flex flex-col items-center gap-6 py-14 text-center sm:py-16`}
      >
        <motion.p
          className="max-w-lg text-[clamp(1.25rem,3vw,1.75rem)] font-medium leading-[1.2] tracking-[0em] text-[#1D1D1D]"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          Get Rukny Mail for {platformName}
        </motion.p>

        <motion.div
          className="flex flex-col items-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Link href={primaryHref} className={agLayout.btnPrimary}>
            <Download className="me-2 size-4" aria-hidden />
            {primaryLabel}
          </Link>
          <Link href="/getting-started" className={agLayout.btnSecondary}>
            Setup guide
          </Link>
        </motion.div>

        <p className="text-[13px] text-[#6B6F76]">
          Webmail works in {platformName} — no install required.
        </p>
      </div>
    </section>
  );
}
