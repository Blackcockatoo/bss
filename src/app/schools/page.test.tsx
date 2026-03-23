import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { schoolPackageDocs } from "@/app/schools/content";
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
  it("surfaces the Australia-wide school packaging content and download links", () => {
    render(<SchoolsPage />);

    expect(
      screen.getByRole("heading", {
        name: /An Australia-wide Years 3-6 classroom sequence teachers can use tomorrow/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Curriculum alignment with explicit classroom fit/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/No marking required/i).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByRole("heading", { name: /Light evidence only/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Where this fits in a school week/i,
      }),
    ).toBeInTheDocument();

    for (const doc of schoolPackageDocs) {
      expect(
        screen.getByRole("link", {
          name: new RegExp(`Download ${doc.title}`, "i"),
        }),
      ).toHaveAttribute("href", doc.href);
    }
  });
});
