import { cn } from "@heroui/react";

export function MailWebmailPreview({
  className,
  fullBleed = false,
}: {
  className?: string;
  fullBleed?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden border border-[#e7e5e4] bg-white",
        fullBleed ? "border-x-0 sm:border-x" : "",
        className,
      )}
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-[#e7e5e4] bg-[#f2f3f6] px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#e7e5e4]" />
        <span className="size-2.5 rounded-full bg-[#e7e5e4]" />
        <span className="size-2.5 rounded-full bg-[#e7e5e4]" />
        <p className="ml-2 truncate text-[11px] font-medium text-[#a8a29e]">
          you@yourdomain.com
        </p>
      </div>

      <div className="grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <div className="border-b border-[#e7e5e4] p-3 sm:border-b-0 sm:border-r">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a8a29e]">
            Inbox
          </p>
          {[
            { from: "Noura", subject: "Q3 invoice", time: "9:14" },
            { from: "Studio", subject: "Brand files", time: "8:02" },
            { from: "Ops", subject: "Mailbox ready", time: "Yesterday" },
          ].map((row, index) => (
            <div
              key={row.subject}
              className={cn(
                "px-2.5 py-2.5",
                index === 0 ? "bg-[#eef2f2]" : "",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[13px] font-semibold text-[#1c1917]">{row.from}</p>
                <p className="text-[10px] text-[#a8a29e]">{row.time}</p>
              </div>
              <p className="mt-0.5 truncate text-[12px] text-[#57534e]">
                {row.subject}
              </p>
            </div>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-[11px] font-medium text-[#a8a29e]">From Noura</p>
          <p className="mt-1 text-[15px] font-semibold text-[#1c1917]">Q3 invoice</p>
          <p className="mt-3 text-[13px] leading-[1.7] text-[#57534e]">
            Please send the signed invoice today. I attached last month’s PDF
            for reference.
          </p>
          <div className="mt-5 border border-[#e7e5e4] bg-[#f2f3f6] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#02797E]">
              Agentic Mail
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-[#57534e]">
              Here’s a clear reply with the invoice attached and a send time
              for this afternoon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
