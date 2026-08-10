import type { LegalSection } from "@/lib/legal/types"

interface LegalSectionBlockProps {
  section: LegalSection
  index: number
  isEn: boolean
}

export function LegalSectionBlock({
  section,
  index,
}: LegalSectionBlockProps) {
  const number = index + 1

  return (
    <section
      id={section.id}
      className="scroll-mt-28"
      {...(section.tocIgnore ? { "data-toc-ignore": true } : {})}
    >
      <h2
        data-toc-title={`${number}. ${section.title}`}
        className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
      >
        <span className="text-muted-foreground">{number}.</span>{" "}
        {section.title}
      </h2>

      <div className="mt-4 space-y-4">
        {section.paragraphs?.map((text) => (
          <p
            key={text}
            className="text-[15px] leading-7 text-[var(--muted-foreground)] sm:text-base sm:leading-8"
          >
            {text}
          </p>
        ))}

        {section.subsections && section.subsections.length > 0 ? (
          <div className="space-y-5 pt-1">
            {section.subsections.map((sub) => (
              <div key={sub.title}>
                <h3 className="mb-1.5 text-base font-semibold text-foreground">
                  {sub.title}
                </h3>
                <p className="text-[15px] leading-7 text-muted-foreground sm:text-base sm:leading-8">
                  {sub.text}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {section.bullets && section.bullets.length > 0 ? (
          <ul className="list-disc space-y-2.5 ps-5 text-[15px] leading-7 text-muted-foreground sm:text-base sm:leading-8">
            {section.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
