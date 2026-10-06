import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { PetRecordV2 } from "@/lib/registry/record";
import { usePetRegistryStore } from "@/lib/registry/runtime";
import { canonicalGenome } from "@/lib/moss60/lab/engine";
import { sha256 } from "@/lib/moss60/lab/random";
import Moss60Observatory from "./Moss60Observatory";

afterEach(() => { act(() => usePetRegistryStore.setState({ activeRecord: null, status: "idle" })); });

async function ready() {
  render(<Moss60Observatory />);
  const run = screen.getByRole("button", { name: "Run 600 steps" });
  await waitFor(() => expect(run).toBeEnabled());
  return run;
}

describe("Moss60 observatory interactions", () => {
  it("runs, changes environments, replays and resets without changing the DNA fingerprint", async () => {
    const run = await ready();
    const hash = screen.getByTestId("dna-fingerprint").textContent;
    fireEvent.click(run);
    expect(screen.getByTestId("tick-count")).toHaveTextContent("600");
    const afterBalanced = screen.getByTestId("expression-reading").textContent;
    fireEvent.change(screen.getByLabelText("Environment"), { target: { value: "spark" } });
    fireEvent.click(run);
    expect(screen.getByTestId("tick-count")).toHaveTextContent("1,200");
    expect(screen.getByTestId("expression-reading").textContent).not.toBe(afterBalanced);
    const expression = screen.getByTestId("expression-reading").textContent;
    fireEvent.click(screen.getByRole("button", { name: "Replay from start" }));
    await waitFor(() => expect(screen.getByRole("status", { name: "Experiment status" })).toHaveTextContent("Replayed"));
    expect(screen.getByTestId("expression-reading").textContent).toBe(expression);
    expect(screen.getByTestId("dna-fingerprint").textContent).toBe(hash);
    fireEvent.click(screen.getByRole("button", { name: "Reset expression" }));
    await waitFor(() => expect(screen.getByTestId("tick-count")).toHaveTextContent(/^0$/));
    expect(screen.getByTestId("expression-reading")).toHaveTextContent("50.0%");
    expect(screen.getByTestId("dna-fingerprint").textContent).toBe(hash);
  });

  it("copies active DNA and preserves the complete runtime record through experiments", async () => {
    const genome = canonicalGenome();
    genome.red60[0] = 8;
    const record = { petId: "lab-test-only", genome, genomeRadix: 10, genomeHash: {
      redHash: await sha256(genome.red60.join("")), blueHash: await sha256(genome.blue60.join("")), blackHash: await sha256(genome.black60.join("")),
    } } as PetRecordV2;
    usePetRegistryStore.getState().setActiveRecord(record);
    const before = JSON.stringify(record);
    const run = await ready();
    fireEvent.click(screen.getByRole("button", { name: "Copy active pet DNA" }));
    await waitFor(() => expect(screen.getByRole("status", { name: "Experiment status" })).toHaveTextContent("Copied active pet DNA"));
    fireEvent.click(run);
    fireEvent.click(screen.getByRole("button", { name: "Replay from start" }));
    await waitFor(() => expect(screen.getByRole("status", { name: "Experiment status" })).toHaveTextContent("Replayed"));
    expect(usePetRegistryStore.getState().activeRecord).toBe(record);
    expect(JSON.stringify(record)).toBe(before);
  });

  it("keeps the running experiment when a malformed import fails", async () => {
    const run = await ready();
    fireEvent.click(run);
    const before = screen.getByTestId("dna-fingerprint").textContent;
    const file = new File(["{}"], "bad.json", { type: "application/json" });
    await act(async () => fireEvent.change(screen.getByLabelText("Import experiment file"), { target: { files: [file] } }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Unsupported experiment"));
    expect(screen.getByTestId("tick-count")).toHaveTextContent("600");
    expect(screen.getByTestId("dna-fingerprint").textContent).toBe(before);
    expect(run).toBeEnabled();
  });
});
