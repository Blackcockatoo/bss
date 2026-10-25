import { render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { GeometryAvatarRenderer } from "../GeometryAvatarRenderer";
import { buildPetRecord, usePetRegistryStore } from "@/lib/registry";
import { serializeGeometrySprite } from "@/lib/games/geometryPilot";

afterEach(() => usePetRegistryStore.setState({ activeRecord: null }));

it("captures the actual approved geometry renderer for the exact registered genome", async () => {
  const hmacKey = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const record = await buildPetRecord({
    name: "Geometry QA",
    random: () => 0.42,
    hmacKey,
  });
  usePetRegistryStore.getState().setActiveRecord(record);
  const { container } = render(
    <GeometryAvatarRenderer
      record={record}
      animated={false}
      compact
      showPersonality={false}
    />,
  );
  const rendered = container.querySelector("[data-geometry-sprite] > svg");
  expect(rendered).not.toBeNull();
  const captured = serializeGeometrySprite(container, record.petId);
  const image = new DOMParser().parseFromString(captured, "image/svg+xml");
  expect(image.querySelector("parsererror")).toBeNull();
  expect(image.querySelectorAll("path").length).toBeGreaterThan(10);
  expect(image.querySelectorAll("path").length).toBe(
    container.querySelectorAll("svg path").length,
  );
  expect(image.documentElement.getAttribute("viewBox")).toBe(
    rendered!.getAttribute("viewBox"),
  );
  expect(image.querySelector('[data-evolution-mark="helix"]')).not.toBeNull();
});
