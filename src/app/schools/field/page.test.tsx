import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import FieldModePage from "@/app/schools/field/page";
import { isPathnameAllowedByPolicy } from "@/lib/childSafeBaseline";

afterEach(cleanup);

describe("Classroom home", () => {
  it("identifies the Australian Years 3–6 classroom product", () => {
    render(<FieldModePage />);
    expect(screen.getAllByText(/MetaPet School/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Years 3–6/i).length).toBeGreaterThan(0);
  });

  it("puts Lesson 1 one click from a cold visit", () => {
    render(<FieldModePage />);

    expect(
      screen.getByRole("link", { name: /Start Lesson 1 in 15 minutes/i }),
    ).toHaveAttribute("href", "/schools/field/lessons/meet-the-system");
    expect(
      screen.getByRole("link", { name: /Browse all seven lessons/i }),
    ).toHaveAttribute("href", "/schools/field/lessons");
  });

  it("lists all seven lessons with published curriculum codes", () => {
    render(<FieldModePage />);
    expect(screen.getByRole("heading", { name: /The seven lessons/i })).toBeInTheDocument();
    expect(screen.getByText("Meet the System")).toBeInTheDocument();
    expect(screen.getByText("Test, Reflect and Improve")).toBeInTheDocument();
    expect(screen.getAllByText(/AC9TDI4K01/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Digital Technologies/).length).toBeGreaterThan(0);
  });

  it("tells a teacher what they need before beginning", () => {
    render(<FieldModePage />);

    expect(
      screen.getByRole("heading", { name: /What you need/i }),
    ).toBeInTheDocument();
    for (const requirement of [
      /About 15–20 minutes/i,
      /No student accounts to create/i,
      /nothing to install/i,
    ]) {
      expect(screen.getAllByText(requirement).length).toBeGreaterThan(0);
    }
  });

  it("offers a printable pack, safety information and local-data controls", () => {
    render(<FieldModePage />);

    expect(
      screen.getByRole("link", {
        name: /Print the classroom pack/i,
      }),
    ).toHaveAttribute("href", "/schools/field/print/all");
    expect(
      screen.getByRole("link", { name: /Safety and privacy/i }),
    ).toHaveAttribute("href", "/schools/field/safety");
    expect(
      screen.getByRole("link", { name: /Open local-data controls/i }),
    ).toHaveAttribute("href", "/schools/data");
  });

  it("links only to routes the classroom policy already admits", () => {
    render(<FieldModePage />);

    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href") ?? "");

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href.startsWith("/"), href).toBe(true);
      expect(
        isPathnameAllowedByPolicy(
          new URL(href, "https://example.test").pathname,
          "field",
        ),
        href,
      ).toBe(true);
    }
  });

  it("offers a child no payment, account or consumer action", () => {
    const { container } = render(<FieldModePage />);
    const text = (container.textContent ?? "").toLowerCase();

    for (const phrase of [
      "subscribe",
      "upgrade",
      "checkout",
      "sign up",
      "sign in",
      "log in",
      "contribute",
      "buy",
      "wallet",
      "go deeper",
    ]) {
      expect(text, phrase).not.toMatch(new RegExp(`\\b${phrase}\\b`));
    }
  });
});
