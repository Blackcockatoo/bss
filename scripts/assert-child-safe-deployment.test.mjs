import { describe, expect, it } from "vitest";

import { evaluateChildSafeDeployment } from "./assert-child-safe-deployment-lib.mjs";

describe("evaluateChildSafeDeployment", () => {
  it("passes when student deployment is disabled", () => {
    const result = evaluateChildSafeDeployment({
      STUDENT_DEPLOYMENT: "false",
      NEXT_PUBLIC_CHILD_SAFE_BASELINE: "false",
    });

    expect(result).toMatchObject({ ok: true, code: 0, level: "log" });
    expect(result.message).toContain("skipping");
  });

  it("fails when student deployment is enabled without the baseline flag", () => {
    const result = evaluateChildSafeDeployment({
      STUDENT_DEPLOYMENT: "true",
      NEXT_PUBLIC_CHILD_SAFE_BASELINE: "false",
    });

    expect(result).toMatchObject({ ok: false, code: 1, level: "error" });
    expect(result.message).toContain("NEXT_PUBLIC_CHILD_SAFE_BASELINE=true");
  });

  it("fails when the app profile is missing for a student deployment", () => {
    const result = evaluateChildSafeDeployment({
      STUDENT_DEPLOYMENT: "true",
      NEXT_PUBLIC_CHILD_SAFE_BASELINE: "true",
    });

    expect(result).toMatchObject({ ok: false, code: 1, level: "error" });
    expect(result.message).toContain("NEXT_PUBLIC_APP_PROFILE=schools");
  });

  it("fails when the schools site url is missing", () => {
    const result = evaluateChildSafeDeployment({
      STUDENT_DEPLOYMENT: "true",
      NEXT_PUBLIC_CHILD_SAFE_BASELINE: "true",
      NEXT_PUBLIC_APP_PROFILE: "schools",
    });

    expect(result).toMatchObject({ ok: false, code: 1, level: "error" });
    expect(result.message).toContain("NEXT_PUBLIC_SITE_URL");
  });

  it("passes when the schools deployment contract is complete", () => {
    const result = evaluateChildSafeDeployment({
      STUDENT_DEPLOYMENT: "true",
      NEXT_PUBLIC_CHILD_SAFE_BASELINE: "true",
      NEXT_PUBLIC_APP_PROFILE: "schools",
      NEXT_PUBLIC_SITE_URL: "https://schools.example.com",
    });

    expect(result).toMatchObject({ ok: true, code: 0, level: "log" });
    expect(result.message).toContain("contract");
  });
});
