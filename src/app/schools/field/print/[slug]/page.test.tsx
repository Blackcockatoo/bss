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
      screen.getByRole("heading", { name: "Lesson 2: Build a Body" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Seven guided stages: Notice, Predict, Act, Observe, Explain, Create, Reflect/),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(7);
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
