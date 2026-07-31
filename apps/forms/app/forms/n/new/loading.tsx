"use client";

import { Spinner } from "@heroui/react";
import { motion } from "framer-motion";
import { FilePlus2 } from "lucide-react";

export default function NewFormDraftLoading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-4 py-32">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center gap-6 text-center"
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-[var(--foreground)] opacity-5" />
          <div className="relative flex size-20 items-center justify-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
            <FilePlus2 className="size-8 text-[var(--foreground)]" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            جاري تحضير مساحة العمل
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] max-w-[280px] mx-auto leading-relaxed">
            نقوم بإنشاء نموذج جديد وتوليد رابط خاص بك للبدء في التعديل...
          </p>
        </div>

        <div className="pt-4">
          <Spinner size="md" color="current" />
        </div>
      </motion.div>
    </div>
  );
}
