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

  it("passes when both student deployment and baseline flags are enabled", () => {
    const result = evaluateChildSafeDeployment({
      STUDENT_DEPLOYMENT: "true",
      NEXT_PUBLIC_CHILD_SAFE_BASELINE: "true",
    });

    expect(result).toMatchObject({ ok: true, code: 0, level: "log" });
    expect(result.message).toContain("enabled");
  });
});
