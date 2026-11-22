import { printArticleClassName } from "@/components/field-mode/PrintToolbar";
import { STAFF_PD_SLIDES, staffPdTotalMinutes } from "@/lib/schools/staffPd";

export function PrintableStaffPd({
  headingLevel = 1,
}: {
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const SectionHeading = headingLevel === 1 ? "h2" : "h3";

  return (
    <article className={printArticleClassName}>
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">
        Staff briefing handout
      </p>
      <Heading className="mt-3 text-3xl font-bold tracking-tight">
        MetaPet School — 15-minute staff briefing
      </Heading>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        A printable run sheet for a short staff meeting. The wording matches
        the projector deck and only uses claims already made in the classroom
        pack. Suggested times add up to {staffPdTotalMinutes()} minutes.
        Speaker notes are included here so a presenter can run it from paper.
      </p>
      <ol className="mt-6 space-y-5">
        {STAFF_PD_SLIDES.map((slide, index) => (
          <li
            key={slide.id}
            className="break-inside-avoid border-t border-slate-300 pt-4"
          >
            <SectionHeading className="text-xl font-bold">
              {index + 1}. {slide.title}{" "}
              <span className="font-medium text-slate-600">
                · about {slide.minutes} min
              </span>
            </SectionHeading>
            {slide.body ? (
              <p className="mt-2 text-sm leading-6">{slide.body}</p>
            ) : null}
            {slide.bullets && slide.bullets.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
                {slide.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {slide.notes ? (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                <strong>Speaker note:</strong> {slide.notes}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </article>
  );
}
