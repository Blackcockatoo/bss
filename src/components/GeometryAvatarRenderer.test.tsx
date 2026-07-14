import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GeometryAvatarRenderer } from './GeometryAvatarRenderer';

const state = vi.hoisted(() => ({
  genome: null as null | {
    red60: number[];
    blue60: number[];
    black60: number[];
  },
  petType: 'geometric',
}));

vi.mock('@/lib/store', () => ({
  useStore: (selector: (value: typeof state) => unknown) => selector(state),
}));

vi.mock('./SriYantraPetDisplay', () => ({
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

describe('GeometryAvatarRenderer', () => {
  beforeEach(() => {
    state.genome = {
      red60: Array.from({ length: 60 }, (_, index) => index),
      blue60: Array.from({ length: 60 }, (_, index) => 59 - index),
      black60: Array.from({ length: 60 }, (_, index) => index * 7),
    };
  });

  it('derives red, blue, and black Moss60 strands from the live genome', () => {
    render(<GeometryAvatarRenderer animated={false} />);

    const renderer = screen.getByTestId('sri-yantra');
    expect(renderer).toHaveAttribute(
      'data-red',
      state.genome!.red60.map((value) => value % 10).join(''),
    );
    expect(renderer).toHaveAttribute(
      'data-blue',
      state.genome!.blue60.map((value) => value % 10).join(''),
    );
    expect(renderer).toHaveAttribute(
      'data-black',
      state.genome!.black60.map((value) => value % 10).join(''),
    );
  });
});
