import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PetProfilePanel } from "./PetProfilePanel";
import { generateFounderCoatOfArms } from "@/lib/lineage";
import { heraldryKey } from "@/lib/lineage/storage";

vi.mock("./CryptoKeyDisplay", () => ({ CryptoKeyDisplay: () => null }));
vi.mock("@/lib/identity/profile", () => ({
  useIdentityProfileStore: (selector: (value: unknown) => unknown) =>
    selector({ profile: { username: "", email: "", avatarDataUrl: "" } }),
}));
beforeEach(() => localStorage.clear());

describe("heraldry customisation", () => {
  it("keeps the saved shield until a replacement is accepted", async () => {
    const original = generateFounderCoatOfArms("one", 2);
    localStorage.setItem(heraldryKey("one"), JSON.stringify(original));
    render(<PetProfilePanel petId="one" petName="Nova" />);
    await screen.findByRole("img", { name: "Nova coat of arms" });
    fireEvent.click(
      screen.getByRole("button", { name: "Preview new coat of arms" }),
    );
    expect(localStorage.getItem(heraldryKey("one"))).toBe(
      JSON.stringify(original),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Keep current shield" }),
    );
    expect(
      screen.queryByRole("img", { name: "New shield preview" }),
    ).not.toBeInTheDocument();
    expect(localStorage.getItem(heraldryKey("one"))).toBe(
      JSON.stringify(original),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Preview new coat of arms" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Keep new shield" }));
    await waitFor(() =>
      expect(localStorage.getItem(heraldryKey("one"))).not.toBe(
        JSON.stringify(original),
      ),
    );
    expect(screen.getByText(/New heraldry saved/)).toBeInTheDocument();
  });

  it("never carries a pending shield across companion identity changes", async () => {
    const { rerender } = render(<PetProfilePanel petId="one" petName="Nova" />);
    await screen.findByRole("img", { name: "Nova coat of arms" });
    fireEvent.click(
      screen.getByRole("button", { name: "Preview new coat of arms" }),
    );
    rerender(<PetProfilePanel petId="two" petName="Echo" />);
    expect(
      screen.queryByRole("button", { name: "Keep new shield" }),
    ).not.toBeInTheDocument();
    await screen.findByRole("img", { name: "Echo coat of arms" });
    const saved = JSON.parse(localStorage.getItem(heraldryKey("two"))!);
    expect(saved.id).toContain("two");
  });
});
