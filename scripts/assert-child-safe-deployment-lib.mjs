export function isEnabled(value) {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function evaluateChildSafeDeployment(env = process.env) {
  const studentDeployment = isEnabled(env.STUDENT_DEPLOYMENT);
  const childSafeBaseline = isEnabled(env.NEXT_PUBLIC_CHILD_SAFE_BASELINE);
  const appProfile = `${env.NEXT_PUBLIC_APP_PROFILE ?? ""}`.trim().toLowerCase();

  if (!studentDeployment) {
    return {
      ok: true,
      code: 0,
      level: "log",
      message:
        "[check:child-safe-deployment] STUDENT_DEPLOYMENT is not enabled; skipping child-safe deployment assertion.",
    };
  }

  if (!childSafeBaseline) {
    return {
      ok: false,
      code: 1,
      level: "error",
      message:
        "[check:child-safe-deployment] Student deployments must set NEXT_PUBLIC_CHILD_SAFE_BASELINE=true.",
    };
  }

  if (appProfile && appProfile !== "schools") {
    return {
      ok: false,
      code: 1,
      level: "error",
      message:
        "[check:child-safe-deployment] Student deployments must set NEXT_PUBLIC_APP_PROFILE=schools.",
    };
  }

  return {
    ok: true,
    code: 0,
    level: "log",
    message:
      "[check:child-safe-deployment] Child-safe deployment flag is enabled for this schools build.",
  };
}
