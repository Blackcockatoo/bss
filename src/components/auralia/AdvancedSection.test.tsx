import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvancedGroup, AdvancedSection } from "./AdvancedSection";

describe("AdvancedSection", () => {
  it("starts collapsed so opening the advanced view costs one screen", () => {
    render(
      <AdvancedSection title="Sacred Games" subtitle="Three of them">
        <p>game body</p>
      </AdvancedSection>,
    );

    const toggle = screen.getByRole("button", { name: /Sacred Games/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("game body")).not.toBeInTheDocument();
  });

  it("toggles its body and keeps the panel wired to the header", () => {
    render(
      <AdvancedSection title="Audio Settings">
        <p>audio body</p>
      </AdvancedSection>,
    );

    const toggle = screen.getByRole("button", { name: /Audio Settings/ });
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const body = screen.getByText("audio body").parentElement;
    expect(body?.id).toBe(toggle.getAttribute("aria-controls"));

    fireEvent.click(toggle);
    expect(screen.queryByText("audio body")).not.toBeInTheDocument();
  });

  it("honours defaultOpen", () => {
    render(
      <AdvancedSection title="Accessibility" defaultOpen>
        <p>a11y body</p>
      </AdvancedSection>,
    );

    expect(screen.getByText("a11y body")).toBeInTheDocument();
  });

  it("gives each section its own open state inside a group", () => {
    render(
      <AdvancedGroup title="Settings">
        <AdvancedSection title="Audio Settings">
          <p>audio body</p>
        </AdvancedSection>
        <AdvancedSection title="Accessibility">
          <p>a11y body</p>
        </AdvancedSection>
      </AdvancedGroup>,
    );

    expect(
      screen.getByRole("heading", { name: "Settings" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Audio Settings/ }));
    expect(screen.getByText("audio body")).toBeInTheDocument();
    expect(screen.queryByText("a11y body")).not.toBeInTheDocument();
  });
});
