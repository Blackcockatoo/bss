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

it("blocks stale execution while a numeric draft is invalid and applies corrected text without blur", async () => {
  render(<ProjectForgeClient />);
  await waitFor(() =>
    expect(useForgeLearningStore.getState().status).toBe("ready"),
  );
  const sequence = screen.getByLabelText("Sequence (2–16 whole numbers, 0–24)");
  fireEvent.change(sequence, { target: { value: "1, nope" } });
  expect(sequence).toHaveAttribute("aria-invalid", "true");
  expect(
    screen.getByRole("button", { name: "Act — run this experiment" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Hear sequence (optional)" }),
  ).toBeDisabled();
  fireEvent.change(sequence, { target: { value: "2, 4" } });
  fireEvent.click(
    screen.getByRole("button", { name: "Act — run this experiment" }),
  );
  expect(
    screen.getByText("Constant difference 2; next value 6."),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /^Sound Studio/ }));
  const rhythm = screen.getByLabelText(/Rhythm: beat lengths/);
  fireEvent.change(rhythm, { target: { value: "1, 3" } });
  expect(
    screen.getByRole("button", { name: "Act — run this experiment" }),
  ).toBeDisabled();
  fireEvent.change(rhythm, { target: { value: "0.5, 2" } });
  expect(
    screen.getByRole("button", { name: "Act — run this experiment" }),
  ).toBeEnabled();
});

it("does not reopen the old project when its save finishes after changing instruments", async () => {
  render(<ProjectForgeClient />);
  await waitFor(() =>
    expect(useForgeLearningStore.getState().status).toBe("ready"),
  );
  const original = useForgeLearningStore.getState().saveProject;
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  useForgeLearningStore.setState({ saveProject: () => pending });
  try {
    fireEvent.click(
      screen.getByRole("button", { name: "Act — run this experiment" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Keep — save project locally" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Sound Studio/ }));
    await act(async () => finish());
    expect(
      screen.getByRole("button", { name: "Keep — save project locally" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Saved revision 1 on this device.")).toBeNull();
  } finally {
    useForgeLearningStore.setState({ saveProject: original });
  }
});
