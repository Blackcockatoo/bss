import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ProjectForgeClient } from "./ProjectForgeClient";
import { buildPetRecord } from "@/lib/registry/registration";
import { usePetRegistryStore } from "@/lib/registry/runtime";
import { useForgeLearningStore } from "@/lib/tools/learningStore";
vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));
beforeEach(async () => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal("IDBKeyRange", IDBKeyRange);
  const hmacKey = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  usePetRegistryStore
    .getState()
    .setActiveRecord(await buildPetRecord({ hmacKey, random: () => 0.42 }));
  useForgeLearningStore.setState({
    petId: null,
    memory: null,
    status: "idle",
    error: null,
  });
});
describe("Child SPARK workspace", () => {
  it("creates with all six instruments, reopens, revises, returns, and deletes without audio or network", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const view = render(<ProjectForgeClient />);
    await waitFor(() =>
      expect(useForgeLearningStore.getState().status).toBe("ready"),
    );
    for (const name of [
      "Pattern Forge",
      "Sound Studio",
      "Discovery Lab",
      "Story Workshop",
      "Maker Bench",
      "Life Compass",
    ]) {
      fireEvent.click(
        screen.getByRole("button", { name: new RegExp("^" + name) }),
      );
      fireEvent.change(screen.getByLabelText("Project title"), {
        target: { value: name + " work" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Act — run this experiment" }),
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Keep — save project locally" }),
      );
      await screen.findByText("Saved revision 1 on this device.");
    }
    expect(useForgeLearningStore.getState().memory?.projects).toHaveLength(6);
    fireEvent.click(
      screen.getByRole("button", { name: "Reopen Pattern Forge work" }),
    );
    fireEvent.change(screen.getByLabelText("Project title"), {
      target: { value: "Revised pattern" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Act — run this experiment" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Keep — save revision locally" }),
    );
    await screen.findByText("Saved revision 2 on this device.");
    view.unmount();
    useForgeLearningStore.setState({
      petId: null,
      memory: null,
      status: "idle",
    });
    render(<ProjectForgeClient />);
    await screen.findByRole("button", { name: "Reopen Revised pattern" });
    expect(useForgeLearningStore.getState().memory?.projects).toHaveLength(6);
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete Revised pattern",
      }),
    );
    await waitFor(() =>
      expect(useForgeLearningStore.getState().memory?.projects).toHaveLength(5),
    );
    expect(fetch).not.toHaveBeenCalled();
  });
  it("clears drafts and hides previous projects when the pet identity changes", async () => {
    render(<ProjectForgeClient />);
    fireEvent.change(screen.getByLabelText("Project title"), {
      target: { value: "Private pet A draft" },
    });
    const hmacKey = await crypto.subtle.generateKey(
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
    const other = await buildPetRecord({ hmacKey, random: () => 0.24 });
    act(() => usePetRegistryStore.getState().setActiveRecord(other));
    expect(screen.getByLabelText("Project title")).toHaveValue("My discovery");
    expect(screen.queryByText("Private pet A draft")).toBeNull();
    await waitFor(() =>
      expect(useForgeLearningStore.getState().status).toBe("ready"),
    );
  });
});
