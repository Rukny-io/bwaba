import type { MailTutorialArticleSection } from "@/lib/mail-tutorials";

interface MailTutorialSectionBlockProps {
  section: MailTutorialArticleSection;
  index: number;
}

export function MailTutorialSectionBlock({
  section,
  index,
}: MailTutorialSectionBlockProps) {
  const number = index + 1;

  return (
    <section id={section.id} className="scroll-mt-28">
      <h2 className="text-xl font-semibold tracking-tight text-[#132327] sm:text-2xl">
        <span className="text-[#132327]/35">{number}.</span> {section.title}
      </h2>

      <div className="mt-4 space-y-4">
        {section.paragraphs?.map((text) => (
          <p
            key={text}
            className="text-[15px] leading-7 text-[#132327]/60 sm:text-base sm:leading-8"
          >
            {text}
          </p>
        ))}

        {section.bullets?.length ? (
          <ul className="list-disc space-y-2.5 ps-5 text-[15px] leading-7 text-[#132327]/60 sm:text-base sm:leading-8">
            {section.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
