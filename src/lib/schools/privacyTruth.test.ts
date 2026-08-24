import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { dataLifecycle } from "@/app/schools/content";
import {
  SCHOOLS_LOCAL_DATA_RETENTION_DAYS as STORAGE_RETENTION_DAYS,
} from "@/lib/schools/storage";

import privacyTruthData from "./privacyTruth.data.json";
import {
  SCHOOL_DATA_LIFECYCLE,
  SCHOOL_PRIVACY_COMMITMENTS,
  SCHOOLS_LOCAL_DATA_RETENTION_DAYS,
} from "./privacyTruth";

const REPO_ROOT = path.resolve(__dirname, "../../..");

function read(relativePath: string) {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

describe("MetaPet School privacy truth", () => {
  it("keeps the implementation and public lifecycle on one retention value", () => {
    expect(SCHOOLS_LOCAL_DATA_RETENTION_DAYS).toBe(35);
    expect(SCHOOLS_LOCAL_DATA_RETENTION_DAYS).toBe(
      privacyTruthData.retentionDays,
    );
    expect(STORAGE_RETENTION_DAYS).toBe(SCHOOLS_LOCAL_DATA_RETENTION_DAYS);
    expect(dataLifecycle).toBe(SCHOOL_DATA_LIFECYCLE);
  });

  it("states the local-record and network boundary together", () => {
    expect(SCHOOL_PRIVACY_COMMITMENTS.localRecords).toMatch(
      /classroom record contents stay in this browser/i,
    );
    expect(SCHOOL_PRIVACY_COMMITMENTS.transmission).toMatch(
      /does not submit classroom-record contents to B\$S/i,
    );
    expect(SCHOOL_PRIVACY_COMMITMENTS.transmission).toMatch(
      /hosting provider still receives ordinary page requests/i,
    );
  });

  it("uses the central statements on each primary school-facing surface", () => {
    const surfaces = [
      "src/app/legal/privacy/page.tsx",
      "src/app/schools/page.tsx",
      "src/app/schools/parents/page.tsx",
      "src/app/schools/field/page.tsx",
      "src/components/TeacherOnboarding.tsx",
    ];

    for (const surface of surfaces) {
      expect(read(surface), surface).toContain("SCHOOL_PRIVACY_COMMITMENTS");
    }
  });

  it("keeps leadership and family documents precise about host requests", () => {
    const documents = [
      "docs/schools-au/04-privacy-and-implementation.md",
      "docs/schools-au/governance/privacy-policy.md",
      "docs/schools-au/governance/parent-carer-privacy-notice.md",
      "docs/schools-au/governance/data-flow-diagram.md",
      "docs/schools-au/governance/privacy-impact-assessment.md",
      "docs/schools-au/teacher-pack/parent-note.md",
    ];

    for (const document of documents) {
      const contents = read(document);
      expect(contents, document).toMatch(/ordinary page requests/i);
      expect(contents, document).toMatch(/classroom[- ]record contents/i);
    }
  });

  it("states the enforceable expiry boundary wherever retention is explained", () => {
    const documents = [
      "docs/schools-au/governance/privacy-policy.md",
      "docs/schools-au/governance/parent-carer-privacy-notice.md",
      "docs/schools-au/governance/child-privacy-notice.md",
      "docs/schools-au/governance/retention-and-deletion-schedule.md",
      "docs/schools-au/teacher-pack/parent-note.md",
    ];

    for (const document of documents) {
      const contents = read(document);
      expect(contents, document).toMatch(/35 days/i);
      expect(contents, document).toMatch(
        /cannot erase browser storage while it is closed/i,
      );
    }
  });

  it("does not turn the application boundary into a blanket no-third-parties claim", () => {
    const register = read(
      "docs/schools-au/governance/third-party-services-register.md",
    );

    expect(register).toMatch(/host of the site sees\s+requests by definition/i);
    expect(register).toMatch(/do not claim `no third parties`/i);
  });
});
