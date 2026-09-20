import type { LegalSection } from "@/lib/legal/types"

interface LegalSectionBlockProps {
  section: LegalSection
}

export function LegalSectionBlock({ section }: LegalSectionBlockProps) {
  return (
    <section id={section.id} className="scroll-mt-28 sm:scroll-mt-24">
      <h2
        data-toc-title={section.title}
        {...(section.tocIgnore ? { "data-toc-ignore": true } : {})}
        className="text-lg font-semibold tracking-tight text-[var(--foreground)] sm:text-[1.35rem]"
      >
        {section.title}
      </h2>

      <div className="mt-3 space-y-3.5 text-[var(--muted-foreground)] sm:mt-4 sm:space-y-4">
        {section.paragraphs?.map((text) => (
          <p
            key={text}
            className="break-words text-[14px] leading-7 sm:text-base sm:leading-8"
          >
            {text}
          </p>
        ))}

        {section.subsections && section.subsections.length > 0 ? (
          <div className="space-y-4 pt-1 sm:space-y-5">
            {section.subsections.map((sub) => (
              <div key={sub.title}>
                <h3 className="mb-1.5 pt-1 text-[14px] font-semibold text-[var(--foreground)] sm:text-[15px]">
                  {sub.title}
                </h3>
                <p className="break-words text-[14px] leading-7 sm:text-base sm:leading-8">
                  {sub.text}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {section.bullets && section.bullets.length > 0 ? (
          <ul className="list-disc space-y-2 ps-4 text-[14px] leading-7 sm:space-y-2.5 sm:ps-5 sm:text-base sm:leading-8">
            {section.bullets.map((item) => (
              <li key={item} className="break-words">{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
