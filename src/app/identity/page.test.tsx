import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import IdentityPage from "@/app/identity/page";

const saveProfile = vi.fn((profile) => ({
  ...profile,
  updatedAt: 1710000000000,
}));
const refreshProfile = vi.fn();
const setLocalIdentity = vi.fn();
const markCompleted = vi.fn();
const mockProfile = {
  email: "",
  username: "",
  avatarDataUrl: "",
  updatedAt: null,
};

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

vi.mock("@/components/RouteProgressionCard", () => ({
  RouteProgressionCard: () => <div data-testid="route-progression-card" />,
}));

vi.mock("@/components/RouteTutorialControls", () => ({
  RouteTutorialControls: () => <button type="button">Replay tutorial</button>,
}));

vi.mock("@/lib/childSafeRoute.client", () => ({
  useEnforceChildSafeClientRoute: () => false,
}));

vi.mock("@/lib/journeyProgress", () => ({
  useJourneyProgressTracker: () => ({
    markCompleted,
    progress: {},
  }),
}));

vi.mock("@/lib/qr-messaging", () => ({
  useQRMessagingStore: (
    selector: (store: { setLocalIdentity: typeof setLocalIdentity }) => unknown,
  ) => selector({ setLocalIdentity }),
}));

vi.mock("@/lib/identity/profile", () => {
  return {
    MAX_AVATAR_BYTES: 128 * 1024,
    getAvatarSizeError: () => null,
    getEmailError: () => null,
    getPreferredIdentity: (profile: { email: string; username: string }) =>
      profile.email || profile.username,
    getUsernameError: () => null,
    useIdentityProfileStore: () => ({
      profile: mockProfile,
      saveProfile,
      refreshProfile,
    }),
  };
});

describe("IdentityPage", () => {
  beforeEach(() => {
    saveProfile.mockClear();
    refreshProfile.mockClear();
    setLocalIdentity.mockClear();
    markCompleted.mockClear();
  });

  it("shows a forward CTA into DNA after a successful save", () => {
    render(<IdentityPage />);

    fireEvent.change(screen.getByPlaceholderText("Starlight Ranger"), {
      target: { value: "Signal Keeper" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Identity/i }));

    expect(saveProfile).toHaveBeenCalled();
    expect(setLocalIdentity).toHaveBeenCalled();
    expect(markCompleted).toHaveBeenCalled();
    expect(
      screen.getByRole("link", { name: /Continue to DNA/i }),
    ).toBeInTheDocument();
  });
});
