export function isEnabled(value) {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function evaluateChildSafeDeployment(env = process.env) {
  const studentDeployment = isEnabled(env.STUDENT_DEPLOYMENT);
  const childSafeBaseline = isEnabled(env.NEXT_PUBLIC_CHILD_SAFE_BASELINE);
  const appProfile = `${env.NEXT_PUBLIC_APP_PROFILE ?? ""}`.trim().toLowerCase();
  const siteUrl = `${env.NEXT_PUBLIC_SITE_URL ?? ""}`.trim();

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

  if (appProfile !== "schools") {
    return {
      ok: false,
      code: 1,
      level: "error",
      message:
        "[check:child-safe-deployment] Student deployments must set NEXT_PUBLIC_APP_PROFILE=schools.",
    };
  }

  if (!hasValue(siteUrl)) {
    return {
      ok: false,
      code: 1,
      level: "error",
      message:
        "[check:child-safe-deployment] Student deployments must set NEXT_PUBLIC_SITE_URL to the dedicated schools domain.",
    };
  }

  try {
    new URL(siteUrl);
  } catch {
    return {
      ok: false,
      code: 1,
      level: "error",
      message:
        "[check:child-safe-deployment] NEXT_PUBLIC_SITE_URL must be a valid absolute URL for the schools deployment.",
    };
  }

  return {
    ok: true,
    code: 0,
    level: "log",
    message:
      "[check:child-safe-deployment] Schools deployment contract is configured for the child-safe build.",
  };
}
