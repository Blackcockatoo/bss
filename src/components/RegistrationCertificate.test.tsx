import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegistrationCertificate } from "./RegistrationCertificate";
import { buildPetRecord, type PetRecordV2 } from "@/lib/registry";
import { heraldryKey } from "@/lib/lineage/storage";

let record: PetRecordV2;
beforeEach(async () => {
  const hmacKey = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  record = await buildPetRecord({
    name: "Nova <script>",
    hmacKey,
    random: () => 0.41,
  });
  localStorage.clear();
  vi.spyOn(HTMLDialogElement.prototype, "showModal").mockImplementation(
    function (this: HTMLDialogElement) {
      this.open = true;
    },
  );
  vi.spyOn(HTMLDialogElement.prototype, "close").mockImplementation(function (
    this: HTMLDialogElement,
  ) {
    this.open = false;
  });
});
afterEach(() => vi.restoreAllMocks());
const certificate = (open = true, onClose = vi.fn()) => (
  <RegistrationCertificate
    record={record}
    crest={record.crest}
    heptaCode={record.heptaCode?.digits ?? null}
    isOpen={open}
    onClose={onClose}
  />
);

describe("RegistrationCertificate", () => {
  it("does not generate heraldry or open a dialog while closed", () => {
    render(certificate(false));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem(heraldryKey(record.petId))).toBeNull();
  });

  it("opens a named modal, restores scroll on close and handles Escape", async () => {
    document.body.style.overflow = "auto";
    const onClose = vi.fn();
    const { unmount } = render(certificate(true, onClose));
    const dialog = screen.getByRole("dialog", {
      name: "Registration certificate",
    });
    expect(document.body.style.overflow).toBe("hidden");
    await screen.findByRole("img", { name: "Nova <script> coat of arms" });
    fireEvent(dialog, new Event("cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("reports clipboard failure and keeps the registered companion available", async () => {
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("Denied"),
    );
    render(certificate());
    fireEvent.click(screen.getByRole("button", { name: "Copy MP2" }));
    await screen.findByText(
      "The pet packet could not be copied. Try saving a pet backup instead.",
    );
    expect(screen.getByText(record.petId)).toBeInTheDocument();
  });

  it("prints the displayed shield with escaped names and no external fonts", async () => {
    const printWindow = {
      document: { write: vi.fn(), close: vi.fn() },
      print: vi.fn(),
    };
    vi.spyOn(window, "open").mockReturnValue(printWindow as unknown as Window);
    render(certificate());
    const printButton = screen.getByRole("button", {
      name: "Print / Download",
    });
    await waitFor(() => expect(printButton).toBeEnabled());
    fireEvent.click(printButton);
    const html = printWindow.document.write.mock.calls[0][0];
    expect(html).toContain("Nova &lt;script&gt;");
    expect(html).toContain('class="coat-of-arms"');
    expect(html).toContain(record.petId);
    expect(html).not.toContain("fonts.googleapis.com");
    expect(printWindow.print).toHaveBeenCalledOnce();
  });

  it("downloads an actual MP2 packet, without submitting companion data", async () => {
    let downloaded: Blob | null = null;
    vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      downloaded = blob as Blob;
      return "blob:pet-backup";
    });
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    render(certificate());
    fireEvent.click(screen.getByRole("button", { name: "Save pet backup" }));
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    expect(downloaded).not.toBeNull();
    expect(await (downloaded as unknown as Blob).text()).toMatch(/^MP2\./);
    expect(screen.getByText(/Pet backup saved/)).toBeInTheDocument();
  });
});
