import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import PrintableLessonPage, {
  generateMetadata,
} from "@/app/schools/field/print/[slug]/page";

afterEach(cleanup);

describe("printable Field lesson fallback", () => {
  it("renders a complete static teacher sheet", async () => {
    const page = await PrintableLessonPage({
      params: Promise.resolve({ slug: "design-a-better-feature" }),
    });
    render(page);

    expect(
      screen.getByRole("heading", { name: "Lesson 6: Design a Better Feature" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Five guided steps")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(5);
    expect(
      screen.getByRole("button", { name: /Print \/ Save as PDF/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/aliases only/i)).toBeInTheDocument();
  });

  it("is indexed as the public printable planner for the lesson", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "meet-the-system" }),
    });
    expect(metadata.title).toBe("Print Lesson 1: Meet the System");
    expect(metadata.robots).toBeUndefined();
    expect(String(metadata.alternates?.canonical)).toContain(
      "/schools/field/print/meet-the-system",
    );
  });

  it("includes EAL/D notes and a projector-slides link on the planner", async () => {
    const page = await PrintableLessonPage({
      params: Promise.resolve({ slug: "meet-the-system" }),
    });
    render(page);

    expect(screen.getByRole("heading", { name: "EAL/D notes" })).toBeInTheDocument();
    expect(screen.getAllByText(/Point to one thing on the screen and say one word about it/).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Projector slides/i })).toHaveAttribute(
      "href",
      "/schools/field/lessons/meet-the-system/slides",
    );
  });
});
