import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  SCHOOL_HEADLINE,
  lessonCards,
  reviewerPathways,
  schoolPackageDocs,
} from "@/app/schools/content";
import SchoolsPage from "@/app/schools/page";
import {
  FREE_PROMISE,
  GOVERNING_PRINCIPLE,
  START_TEACHING_ACTION,
} from "@/lib/schools/contribution";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/childSafeRoute.server", () => ({
  enforceChildSafeServerRoute: vi.fn(),
}));

/** Everything the entry screen is allowed to contain, in order. */
describe("SchoolsPage entry", () => {
  it("shows identity, headline, one short explanation and one primary action", () => {
    render(<SchoolsPage />);

    expect(screen.getByText("MetaPet School")).toBeInTheDocument();
    expect(
      screen.getByText("An education initiative of Blue $nake Studio"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: SCHOOL_HEADLINE }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: START_TEACHING_ACTION })[0],
    ).toHaveAttribute("href", "/schools/field/start");
  });

  it("states the complete-free promise as body text, not microcopy", () => {
    render(<SchoolsPage />);

    const promise = screen.getByText(FREE_PROMISE);
    expect(promise).toBeInTheDocument();
    // `text-base` or larger; never a muted `text-xs` legal line.
    expect(promise.className).toMatch(/\btext-base\b/);
    expect(promise.className).not.toMatch(/text-(xs|sm)\b/);
  });

  it("keeps the secondary actions visually subordinate to the primary one", () => {
    render(<SchoolsPage />);

    for (const name of [
      /Browse the seven lessons/i,
      /Review safety and privacy/i,
    ]) {
      const link = screen.getByRole("link", { name });
      // Underlined text links, not filled buttons competing with the CTA.
      expect(link.className).toMatch(/underline/);
      expect(link.className).not.toMatch(/bg-emerald-400/);
    }
  });

  it("never asks the visitor to choose a plan on the entry screen", () => {
    const { container } = render(<SchoolsPage />);
    const text = (container.textContent ?? "").toLowerCase();

    for (const phrase of [
      "choose your",
      "select a plan",
      "most popular",
      "recommended plan",
      "unlock",
      "premium",
      "free trial",
      "upgrade",
    ]) {
      expect(text, phrase).not.toContain(phrase);
    }
  });
});

describe("SchoolsPage governing principle", () => {
  it("renders both lines at display size, in full-contrast text", () => {
    render(<SchoolsPage />);

    const band = screen.getByRole("region", { name: /governing principle/i });
    const statement = within(band).getByText(GOVERNING_PRINCIPLE[0])
      .parentElement as HTMLElement;

    for (const line of GOVERNING_PRINCIPLE) {
      expect(within(band).getByText(line)).toBeInTheDocument();
    }

    // ~24px mobile, ~36px desktop. Never muted grey, never inside a details.
    expect(statement.className).toMatch(/\btext-2xl\b/);
    expect(statement.className).toMatch(/md:text-4xl/);
    expect(statement.className).toMatch(/text-white/);
    expect(statement.closest("details")).toBeNull();
  });

  it("places the principle directly after the hero, not in the footer", () => {
    const { container } = render(<SchoolsPage />);
    const sections = Array.from(container.querySelectorAll("section"));
    const bandIndex = sections.findIndex((section) =>
      (section.textContent ?? "").includes(GOVERNING_PRINCIPLE[0]),
    );

    expect(bandIndex).toBe(1);
  });
});

describe("SchoolsPage contribution placement", () => {
  it("puts contribution after what it is, what teachers do and the privacy answer", () => {
    const { container } = render(<SchoolsPage />);
    const text = container.textContent ?? "";

    const contributionAt = text.indexOf("Use it free. Contribute if you can.");
    expect(contributionAt).toBeGreaterThan(-1);

    for (const earlier of [
      "This does not replace the software that runs your school",
      "What children do",
      "What teachers do",
      "What happens to the data?",
    ]) {
      expect(text.indexOf(earlier), earlier).toBeLessThan(contributionAt);
    }
  });

  it("shows no contribution amount on the landing page at all", () => {
    const { container } = render(<SchoolsPage />);
    const text = container.textContent ?? "";

    for (const amount of ["A$250", "A$750", "A$1,500"]) {
      expect(text, amount).not.toContain(amount);
    }
  });

  it("offers free access as the action and contribution as a plain link", () => {
    render(<SchoolsPage />);

    const free = screen.getByRole("link", {
      name: /Use MetaPet School — A\$0/i,
    });
    expect(free).toHaveAttribute("href", "/schools/field/start");
    expect(free.className).toMatch(/bg-emerald-400/);

    const contribute = screen.getByRole("link", {
      name: /See the optional contribution amounts/i,
    });
    expect(contribute).toHaveAttribute("href", "/schools/contribute");
    expect(contribute.className).toMatch(/underline/);
    expect(contribute.className).not.toMatch(/bg-emerald-400/);
  });
});

describe("SchoolsPage preserved material", () => {
  it("still shows the one canonical seven-session sequence", () => {
    render(<SchoolsPage />);

    for (const lesson of lessonCards) {
      expect(screen.getByText(lesson.title)).toBeInTheDocument();
    }
  });

  it("still answers the whole local-data lifecycle", () => {
    render(<SchoolsPage />);

    const data = within(document.getElementById("data") as HTMLElement);
    expect(data.getByText("What is stored?")).toBeInTheDocument();
    expect(data.getByText("When does it disappear?")).toBeInTheDocument();
    expect(
      data.getByRole("link", { name: /Open the local-data controls/i }),
    ).toHaveAttribute("href", "/schools/data");
  });

  it("still makes every reviewer pathway and document discoverable", () => {
    render(<SchoolsPage />);

    for (const pathway of reviewerPathways) {
      expect(
        screen.getByRole("heading", { name: pathway.title }),
      ).toBeInTheDocument();
    }

    for (const doc of schoolPackageDocs) {
      expect(
        screen.getByRole("link", {
          name: new RegExp(`Download ${doc.title}`, "i"),
        }),
      ).toHaveAttribute("href", doc.href);
    }
  });

  it("still separates MetaPet School from school-management software", () => {
    render(<SchoolsPage />);

    expect(
      screen.getByText(
        /Keep your existing school platform for attendance, payments, timetables and communication/i,
      ),
    ).toBeInTheDocument();
  });

  it("still routes no evaluator into the consumer product", () => {
    render(<SchoolsPage />);

    const consumerRoutes = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href") ?? "")
      .filter((href) =>
        /^\/(pet|shop|app|pricing|identity|dna-hub|body-forge|alchemest)\b/.test(
          href,
        ),
      );
    expect(consumerRoutes).toEqual([]);
  });
});
