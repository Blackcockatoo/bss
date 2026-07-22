import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { GET as exitField } from "@/app/schools/field/exit/route";
import { GET as startField } from "@/app/schools/field/start/route";
import {
  FIELD_MODE_COOKIE,
  FIELD_MODE_COOKIE_VALUE,
} from "@/lib/childSafeBaseline";

describe("Field Mode entry and exit handlers", () => {
  it("starts at the approved Field lesson launchpad", () => {
    const response = startField(
      new NextRequest("https://example.com/schools/field/start"),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.com/schools/field/lessons",
    );
    expect(response.cookies.get(FIELD_MODE_COOKIE)?.value).toBe(
      FIELD_MODE_COOKIE_VALUE,
    );
  });

  it("clears Field Mode and returns to the schools surface", () => {
    const response = exitField(
      new NextRequest("https://example.com/schools/field/exit"),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.com/schools",
    );
    expect(response.headers.get("set-cookie")).toMatch(/Max-Age=0/i);
  });
});
