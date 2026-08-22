import { describe, expect, it } from "vitest";

import { buildPartnerNotification } from "../server/partner-notifications";

describe("partner notification content", () => {
  it("keeps a private update discreet and directs the recipient to the protected section", () => {
    expect(buildPartnerNotification("private-update", "beans")).toEqual({
      title: "Together Daily",
      body: "Beans added a private update.",
      path: "/steamy",
    });
  });

  it("confirms that Princess connected without exposing room credentials", () => {
    const notification = buildPartnerNotification("connection", "princess");
    expect(notification.body).toBe("Princess connected to your private room.");
    expect(notification.body).not.toContain("Room code:");
  });
});
