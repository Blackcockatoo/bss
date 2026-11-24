import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { FIELD_MODE_COOKIE, FIELD_MODE_COOKIE_VALUE } from "@/lib/childSafeBaseline";

function visit(url: string, fieldMode = false) {
  const request = new NextRequest(url);
  if (fieldMode) request.cookies.set(FIELD_MODE_COOKIE, FIELD_MODE_COOKIE_VALUE);
  return proxy(request);
}

describe("/expressions routing boundary", () => {
  it("is never served on the MetaPet.school host", () => {
    const response = visit("https://metapet.school/expressions");
    const location = response.headers.get("location");
    expect(location).toBeTruthy();
    expect(new URL(location!).pathname).not.toBe("/expressions");
    expect(new URL(location!).host).toBe("metapet.school");
  });

  it("is blocked once a browser is in Field Mode on the consumer host", () => {
    const response = visit("https://www.bluesnakestudios.com/expressions", true);
    const location = response.headers.get("location");
    expect(location).toBeTruthy();
    expect(new URL(location!).pathname).not.toBe("/expressions");
  });

  it("stays reachable on the consumer host outside Field Mode", () => {
    const response = visit("https://www.bluesnakestudios.com/expressions");
    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBe(200);
  });
});
