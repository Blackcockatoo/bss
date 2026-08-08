import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import PrintableLessonPage, {
  generateMetadata,
} from "@/app/schools/field/print/[slug]/page";

afterEach(cleanup);

describe("printable Field lesson fallback", () => {
  it("renders a complete static teacher sheet", async () => {
    const page = await PrintableLessonPage({
      params: Promise.resolve({ slug: "build-a-body" }),
    });
    render(page);

    expect(
      screen.getByRole("heading", { name: "Lesson 6: Design a Better Feature" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Opening, three activity stages and finish",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(5);
    expect(
      screen.getByRole("button", { name: /Print \/ Save as PDF/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/aliases only/i)).toBeInTheDocument();
  });

  it("is explicitly excluded from search indexing", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "meet-your-metapet" }),
    });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
