import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { partnerNotificationPath, partnerNotificationPathFromData } from "../lib/notification-navigation";

describe("notification launch safety", () => {
  it("accepts only valid Together Daily notification destinations", () => {
    expect(partnerNotificationPath("/")).toBe("/");
    expect(partnerNotificationPath("/log")).toBe("/log");
    expect(partnerNotificationPath("/steamy")).toBe("/steamy");
    expect(partnerNotificationPath("/themes")).toBe("/themes");
    expect(partnerNotificationPath("/not-a-screen")).toBeNull();
    expect(partnerNotificationPath("https://unexpected.example")).toBeNull();
    expect(partnerNotificationPathFromData({ path: "/steamy" })).toBe("/steamy");
    expect(partnerNotificationPathFromData({ path: 42 })).toBeNull();
  });

  it("queues notification routing until the root navigation stack is ready", () => {
    const layout = readFileSync(resolve(process.cwd(), "app/_layout.tsx"), "utf8");

    expect(layout).toContain("usePartnerNotificationNavigation(fontsLoaded || Boolean(fontError))");
    expect(layout).toContain("if (!navigationReady || !pendingPath) return;");
    expect(layout).toContain("router.replace(pendingPath as never)");
    expect(layout).toContain("partnerNotificationPathFromData");
    expect(layout).toContain("clearLastNotificationResponseAsync");
  });
});
