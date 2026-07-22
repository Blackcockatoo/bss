import { describe, expect, it } from "vitest";

import { metadata } from "@/app/schools/field/layout";
import {
  FIELD_MODE_APPLE_TOUCH_ICON_PATH,
  FIELD_MODE_ICON_192_PATH,
  FIELD_MODE_ICON_512_PATH,
} from "@/lib/fieldMode/pwa";

describe("Field Mode install metadata", () => {
  it("overrides the shared app shell with MetaPet.school icons", () => {
    const icons = metadata.icons;
    const appleWebApp =
      metadata.appleWebApp && typeof metadata.appleWebApp !== "boolean"
        ? metadata.appleWebApp
        : null;

    expect(metadata.manifest).toBe("/schools/field/manifest.webmanifest");
    expect(icons).toMatchObject({
      icon: expect.arrayContaining([
        expect.objectContaining({ url: FIELD_MODE_ICON_192_PATH }),
        expect.objectContaining({ url: FIELD_MODE_ICON_512_PATH }),
      ]),
      apple: expect.objectContaining({
        url: FIELD_MODE_APPLE_TOUCH_ICON_PATH,
      }),
    });
    expect(appleWebApp?.title).toBe("MetaPet School");
  });
});
