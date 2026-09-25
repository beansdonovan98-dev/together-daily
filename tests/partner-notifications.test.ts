import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { buildPartnerNotification } from "../server/partner-notifications";

describe("partner notification content", () => {
  it("keeps a private update discreet and directs the recipient to the protected section", () => {
    expect(buildPartnerNotification("private-update", "beans")).toEqual({
      title: "Together Daily",
      body: "Daddy added a private update.",
      path: "/steamy",
    });
  });

  it("alerts the other partner about a Steamy update without exposing private content", () => {
    expect(buildPartnerNotification("steamy-update", "princess")).toEqual({
      title: "Together Daily",
      body: "Princess added a Steamy update.",
      path: "/steamy",
    });
  });

  it("uses the Steamy-specific event for intimate log entries, private media, and private media comments", () => {
    const journal = readFileSync(resolve(process.cwd(), "lib/local-journal.tsx"), "utf8");
    const database = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");

    expect(journal).toContain('recordType==="cumLog"||recordType==="steamyChat"?"steamy-update"');
    expect((database.match(/notifyGuestRoomPartner\(roomCode, input\.partnerId, "steamy-update"\)/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("confirms that Princess connected without exposing room credentials", () => {
    const notification = buildPartnerNotification("connection", "princess");
    expect(notification.body).toBe("Princess connected to your private room.");
    expect(notification.body).not.toContain("Room code:");
  });
});
