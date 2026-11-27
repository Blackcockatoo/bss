import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { buildPetRecord } from "@/lib/registry/registration";
import { saveGuardianState, clearGuardianState } from "@/auralia/persistence";
import { AliveProvider, useAlive, useAliveMotionPreference, useAliveReducedMotion } from "./AliveContext";

const seen: { setPreference: ((reduced: boolean) => void) | null; director: ReturnType<typeof useAlive> } = { setPreference: null, director: null };
function Probe() {
  const director = useAlive();
  const setPreference = useAliveMotionPreference();
  useEffect(() => {
    seen.director = director;
    seen.setPreference = setPreference;
  });
  return <span data-testid="reduced">{String(useAliveReducedMotion())}</span>;
}

async function mount() {
  const hmacKey = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const record = await buildPetRecord({ hmacKey, random: () => .37 });
  render(<AliveProvider record={record} form="auralia" editing={false} controls={null}><Probe /></AliveProvider>);
}

afterEach(() => {
  clearGuardianState();
  seen.setPreference = null;
  seen.director = null;
});

describe("living performance motion policy", () => {
  it("follows MetaPet's in-app Reduce Motion switch, not only the device setting", async () => {
    await mount();
    expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(false);
    expect(seen.director!.isReduced()).toBe(false);
    expect(screen.getByTestId("reduced").textContent).toBe("false");
    act(() => seen.setPreference!(true));
    expect(seen.director!.isReduced()).toBe(true);
    expect(screen.getByTestId("reduced").textContent).toBe("true");
    act(() => seen.setPreference!(false));
    expect(seen.director!.isReduced()).toBe(false);
  });

  it("starts still when the saved guardian settings ask for reduced motion, on any form", async () => {
    saveGuardianState({ accessibility: { reduceMotion: true, highContrast: false, audioOffByDefault: false } } as Parameters<typeof saveGuardianState>[0]);
    await mount();
    expect(seen.director!.isReduced()).toBe(true);
    expect(screen.getByTestId("reduced").textContent).toBe("true");
  });
});
