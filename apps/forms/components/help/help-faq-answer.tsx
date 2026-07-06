'use client';

import type { HelpFaqLink } from '@/lib/help/help-content';
import { HelpLink, HelpLinkChip } from '@/components/help/help-link';

interface HelpFaqAnswerProps {
  answer: string;
  links?: HelpFaqLink[];
}

export function HelpFaqAnswer({ answer, links }: HelpFaqAnswerProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-[var(--foreground)]/85">
        {answer}
      </p>
      {links && links.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-t border-[var(--border)]/50 pt-3">
          {links.map((link) => (
            <HelpLinkChip
              key={`${link.href}-${link.label}`}
              href={link.href}
              label={link.label}
              external={link.external}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** For inline mentions in future rich answers */
export { HelpLink };
