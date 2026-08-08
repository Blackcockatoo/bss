import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import FieldModePage from "@/app/schools/field/page";
import { isPathnameAllowedByPolicy } from "@/lib/childSafeBaseline";

afterEach(cleanup);

describe("Field Mode entry", () => {
  it("identifies the Australian Years 3–6 classroom product", () => {
    render(<FieldModePage />);
    expect(screen.getAllByText(/MetaPet School/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Years 3–6/i).length).toBeGreaterThan(0);
  });

  it("makes the permanent free classroom model visible on the real domain entry", () => {
    render(<FieldModePage />);
    expect(screen.getByText(/free forever/i)).toBeInTheDocument();
    expect(screen.getByText(/no per-student fee/i)).toBeInTheDocument();
    expect(screen.getByText(/no expiring trial/i)).toBeInTheDocument();
    expect(screen.getByText(/No school is too poor to use it/i)).toBeInTheDocument();
    expect(
      screen.getByText(/No school is too wealthy to help sustain it/i),
    ).toBeInTheDocument();
  });

  it("puts Session One one click from a cold visit", () => {
    render(<FieldModePage />);

    expect(
      screen.getByRole("link", { name: /Start Session One/i }),
    ).toHaveAttribute("href", "/schools/field/lessons/meet-the-system");
    expect(
      screen.getByRole("link", { name: /Run the seven-session sequence/i }),
    ).toHaveAttribute("href", "/schools/field/start");
  });

  it("tells a teacher what they need before beginning", () => {
    render(<FieldModePage />);

    expect(
      screen.getByRole("heading", { name: /What you need/i }),
    ).toBeInTheDocument();
    for (const requirement of [
      /About 20 minutes/i,
      /No student accounts to create/i,
      /nothing to install/i,
    ]) {
      expect(screen.getAllByText(requirement).length).toBeGreaterThan(0);
    }
  });

  it("offers a printable fallback and a route to the data explanation", () => {
    render(<FieldModePage />);

    expect(
      screen.getByRole("link", { name: /Print the Session One paper fallback/i }),
    ).toHaveAttribute("href", "/schools/field/print/meet-the-system");
    expect(
      screen.getByRole("link", { name: /See exactly what data it uses/i }),
    ).toHaveAttribute("href", "/schools/field/safety");
  });

  it("links nowhere outside the Field Mode boundary", () => {
    // A link off this page is a link a supervised child can follow. Every one
    // has to be a route the Field policy already admits.
    render(<FieldModePage />);

    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href") ?? "");

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href.startsWith("/"), href).toBe(true);
      expect(isPathnameAllowedByPolicy(href, "field"), href).toBe(true);
    }
  });

  it("offers a child no payment, account or consumer action", () => {
    const { container } = render(<FieldModePage />);
    const text = (container.textContent ?? "").toLowerCase();

    // Word-boundary matched: the page is allowed to say it has no shopping,
    // it is not allowed to offer any.
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
    ]) {
      expect(text, phrase).not.toMatch(new RegExp(`\\b${phrase}\\b`));
    }
  });
});
