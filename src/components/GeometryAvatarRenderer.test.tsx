import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GeometryAvatarRenderer } from "./GeometryAvatarRenderer";
import { deriveSriYantraProjectionV2 } from "@/lib/geometry/projection";

const state = vi.hoisted(() => ({
  genome: null as null | {
    red60: number[];
    blue60: number[];
    black60: number[];
  },
  petType: "geometric",
}));

vi.mock("@/lib/store", () => ({
  useStore: (selector: (value: typeof state) => unknown) => selector(state),
}));

vi.mock("./SriYantraPetDisplay", () => ({
  SriYantraPetDisplay: ({
    red,
    blue,
    black,
  }: {
    red: string;
    blue: string;
    black: string;
  }) => (
    <div
      data-testid="sri-yantra"
      data-red={red}
      data-blue={blue}
      data-black={black}
    />
  ),
}));

describe("GeometryAvatarRenderer", () => {
  beforeEach(() => {
    state.genome = {
      red60: Array.from({ length: 60 }, (_, index) => index),
      blue60: Array.from({ length: 60 }, (_, index) => 59 - index),
      black60: Array.from({ length: 60 }, (_, index) => index * 7),
    };
  });

  it("projects all three live strands through the chamber-aware lens", () => {
    render(<GeometryAvatarRenderer animated={false} />);

    const renderer = screen.getByTestId("sri-yantra");
    const expected = deriveSriYantraProjectionV2(state.genome!);
    expect(renderer).toHaveAttribute("data-red", expected.strands.red);
    expect(renderer).toHaveAttribute("data-blue", expected.strands.blue);
    expect(renderer).toHaveAttribute("data-black", expected.strands.black);
    expect(
      screen.getByTestId("geometry-personality-intent"),
    ).toBeInTheDocument();
  });
});
