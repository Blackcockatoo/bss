import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  SCHOOL_HEADLINE,
  SCHOOL_TRUST_LINE,
  lessonCards,
  reviewerPathways,
  schoolPackageDocs,
} from "@/app/schools/content";
import SchoolsPage from "@/app/schools/page";

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

describe("SchoolsPage", () => {
  it("leads with the product promise, both calls to action and the trust line", () => {
    render(<SchoolsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: SCHOOL_HEADLINE }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Run one class free/i })[0],
    ).toHaveAttribute("href", "/schools/field");
    expect(
      screen.getByRole("link", { name: /See exactly what data it uses/i }),
    ).toHaveAttribute("href", "#data");
    expect(screen.getByText(SCHOOL_TRUST_LINE)).toBeInTheDocument();
  });

  it("gets a teacher to Session One without an account, payment or sales form", () => {
    render(<SchoolsPage />);

    expect(
      screen.getByRole("link", { name: /Preview Session One/i }),
    ).toHaveAttribute("href", "/schools/field/lessons/meet-the-system");
    expect(screen.getByText(/No student accounts to create/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /What you need/i }),
    ).toBeInTheDocument();
  });

  it("separates MetaPet School from school-management software", () => {
    render(<SchoolsPage />);

    expect(
      screen.getByText(
        /Keep your existing school platform for attendance, payments, timetables and communication/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/not a school-management system/i),
    ).toBeInTheDocument();
  });

  it("presents A\\$0 as a complete offer rather than a lesser tier", () => {
    render(<SchoolsPage />);

    expect(screen.getByText("A$0")).toBeInTheDocument();
    expect(
      screen.getByText(/The complete experience\. No conditions\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /See contribution options/i }),
    ).toHaveAttribute("href", "/schools/contribute");
  });

  it("shows the local-data lifecycle and a route to the deletion controls", () => {
    render(<SchoolsPage />);

    const dataSection = document.getElementById("data");
    expect(dataSection).not.toBeNull();
    const data = within(dataSection as HTMLElement);

    expect(data.getByText("What is stored?")).toBeInTheDocument();
    expect(data.getByText("When does it disappear?")).toBeInTheDocument();
    expect(data.getByText(/How does a teacher delete it\?/i)).toBeInTheDocument();
    expect(
      data.getByRole("link", { name: /Open the local-data controls/i }),
    ).toHaveAttribute("href", "/schools/data");
  });

  it("shows the one canonical seven-session sequence", () => {
    render(<SchoolsPage />);

    for (const lesson of lessonCards) {
      expect(
        screen.getByRole("heading", { name: lesson.title }),
      ).toBeInTheDocument();
    }
  });

  it("links the broader consumer universe only as an adult-labelled outbound link", () => {
    render(<SchoolsPage />);

    const consumerLink = screen.getByRole("link", {
      name: /Complete MetaPet at Blue \$nake Studio/i,
    });
    expect(consumerLink).toHaveAttribute(
      "href",
      "https://www.bluesnakestudios.com",
    );
    expect(consumerLink).toHaveAttribute("target", "_blank");
  });

  it("keeps every governance, curriculum and reviewer pathway discoverable", () => {
    render(<SchoolsPage />);

    expect(
      screen.getByRole("heading", {
        name: /Curriculum alignment with explicit classroom fit/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Choose the pack for your role/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Light evidence only/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Pilot-ready material for leadership, ICT, and wellbeing review/i,
      }),
    ).toBeInTheDocument();

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
      expect(doc.href).toMatch(/\.md$/);
    }
  });

  it("routes no evaluator into the consumer product by accident", () => {
    render(<SchoolsPage />);

    const internalHrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href") ?? "")
      .filter((href) => href.startsWith("/"));

    const consumerRoutes = internalHrefs.filter((href) =>
      /^\/(pet|shop|app|pricing|identity|dna-hub|body-forge|alchemest)\b/.test(
        href,
      ),
    );
    expect(consumerRoutes).toEqual([]);
  });
});
