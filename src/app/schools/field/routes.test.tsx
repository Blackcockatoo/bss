import { describe, expect, it } from "vitest";

import FieldLessonPage from "@/app/schools/field/lessons/[slug]/page";
import FieldPassportPage from "@/app/schools/field/passport/page";
import FieldReviewPage from "@/app/schools/field/review/page";

describe("Field Mode Pass 3 route adapters", () => {
  it("runs the shared lesson engine in demonstration-only Field mode", async () => {
    const element = await FieldLessonPage({
      params: Promise.resolve({ slug: "design-a-better-feature" }),
      searchParams: Promise.resolve({
        years: "years-5-6",
        minutes: "20",
        support: "low-sensory",
      }),
    });
    expect(element.props.slug).toBe("design-a-better-feature");
    expect(element.props.fieldMode).toBe(true);
    expect(element.props.hubPath).toBe("/schools/field/lessons");
    expect(element.props.fieldSession).toMatchObject({
      yearBand: "years-5-6",
      durationMinutes: 20,
      supportMode: "low-sensory",
    });
  });

  it("adapts Passport and evidence review to Field-safe paths", () => {
    const passport = FieldPassportPage();
    expect(passport.props.fieldMode).toBe(true);
    expect(passport.props.hubPath).toBe("/schools/field/lessons");

    const review = FieldReviewPage();
    expect(review.props.fieldMode).toBe(true);
    expect(review.props.hubPath).toBe("/schools/field/lessons");
    expect(review.props.passportPath).toBe("/schools/field/passport");
  });
});
