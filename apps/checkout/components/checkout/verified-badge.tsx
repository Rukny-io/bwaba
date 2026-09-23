import { ShieldCheck } from 'lucide-react';
import { maskPhone } from '@/lib/session';

export function VerifiedBadge({ phoneNumber }: { phoneNumber: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/80 px-3.5 py-3 ring-1 ring-emerald-100">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
        <ShieldCheck className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-emerald-800/80">تم التحقق من الهاتف</p>
        <p
          className="truncate text-sm font-medium tabular-nums text-emerald-950"
          dir="ltr"
        >
          {maskPhone(phoneNumber)}
        </p>
      </div>
    </div>
  );
}
