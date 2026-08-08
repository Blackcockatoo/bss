import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FIELD_PACK_STATUS_EVENT,
  getFieldPackStatus,
  setFieldPackBypass,
} from "./offlinePack.client";

class FakeMessageChannel {
  port1: {
    onmessage: ((event: MessageEvent) => void) | null;
    close: () => void;
  };
  port2: { reply: (data: unknown) => void };

  constructor() {
    this.port1 = { onmessage: null, close: vi.fn() };
    this.port2 = {
      reply: (data) => this.port1.onmessage?.({ data } as MessageEvent),
    };
  }
}

const originalServiceWorker = Object.getOwnPropertyDescriptor(
  navigator,
  "serviceWorker",
);
const originalOnline = Object.getOwnPropertyDescriptor(navigator, "onLine");
const originalMessageChannel = globalThis.MessageChannel;

beforeEach(() => {
  const worker = {
    state: "activated",
    postMessage: (
      _command: unknown,
      ports: Array<{ reply: (data: unknown) => void }>,
    ) => {
      ports[0]?.reply({
        ok: true,
        result: {
          supported: true,
          active: null,
          previous: null,
          bypassed: false,
        },
      });
    },
  };

  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: false,
  });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      getRegistration: vi.fn().mockResolvedValue({ active: worker }),
    },
  });
  vi.stubGlobal(
    "MessageChannel",
    FakeMessageChannel as unknown as typeof MessageChannel,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalServiceWorker) {
    Object.defineProperty(navigator, "serviceWorker", originalServiceWorker);
  } else {
    Reflect.deleteProperty(navigator, "serviceWorker");
  }
  if (originalOnline) {
    Object.defineProperty(navigator, "onLine", originalOnline);
  } else {
    Reflect.deleteProperty(navigator, "onLine");
  }
  globalThis.MessageChannel = originalMessageChannel;
});

describe("Field Pack status notifications", () => {
  it("does not emit a changed event for a read-only status request", async () => {
    const dispatch = vi.spyOn(window, "dispatchEvent");

    await getFieldPackStatus();

    expect(
      dispatch.mock.calls.filter(([event]) => event.type === FIELD_PACK_STATUS_EVENT),
    ).toHaveLength(0);
  });

  it("emits a changed event after a mutating command", async () => {
    const dispatch = vi.spyOn(window, "dispatchEvent");

    await setFieldPackBypass(true);

    expect(
      dispatch.mock.calls.filter(([event]) => event.type === FIELD_PACK_STATUS_EVENT),
    ).toHaveLength(1);
  });
});
