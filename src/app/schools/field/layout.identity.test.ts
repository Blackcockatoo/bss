import { describe, expect, it } from "vitest";

import { metadata, viewport } from "@/app/schools/field/layout";
import {
  METAPET_SCHOOL_NAME,
  METAPET_SCHOOL_ORIGIN,
  METAPET_SCHOOL_THEME_COLOR,
} from "@/lib/fieldMode/identity";

/**
 * MetaPet School ships from the Blue Snake Studios build, where the root
 * layout resolves its identity from build-time env. These assertions pin the
 * classroom surface to its own identity so a shared-shell change cannot
 * silently re-brand the classroom product.
 */
describe("MetaPet School standalone identity", () => {
  it("resolves canonical and social URLs against the classroom domain", () => {
    const metadataBase = metadata.metadataBase;
    expect(metadataBase).toBeInstanceOf(URL);
    expect((metadataBase as URL).origin).toBe(METAPET_SCHOOL_ORIGIN);
    expect(metadata.alternates?.canonical).toBe(
      `${METAPET_SCHOOL_ORIGIN}/schools/field`,
    );
  });

  it("does not inherit the Blue Snake Studios social identity", () => {
    const openGraph = metadata.openGraph;
    expect(openGraph).toBeTruthy();
    expect(openGraph && "siteName" in openGraph ? openGraph.siteName : null).toBe(
      METAPET_SCHOOL_NAME,
    );

    const serialized = JSON.stringify({
      title: metadata.title,
      description: metadata.description,
      openGraph: metadata.openGraph,
      twitter: metadata.twitter,
      applicationName: metadata.applicationName,
    });
    expect(serialized).not.toMatch(/Blue Snake Studios/i);
  });

  it("declares the light classroom chrome rather than the shared dark shell", () => {
    expect(viewport.themeColor).toBe(METAPET_SCHOOL_THEME_COLOR);
    expect(viewport.colorScheme).toBe("light");
  });

  it("carries an Australian locale on the social card", () => {
    const openGraph = metadata.openGraph;
    expect(
      openGraph && "locale" in openGraph ? openGraph.locale : null,
    ).toBe("en_AU");
  });
});
