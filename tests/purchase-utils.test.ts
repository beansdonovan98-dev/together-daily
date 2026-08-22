import { describe, expect, it } from "vitest";
import { clearPurchasedGroceriesFromPreviousDays } from "../lib/purchase-utils";

describe("grocery cleanup", () => {
  it("retains active groceries and purchases made today while clearing prior-day purchases", () => {
    const items = [
      { id: "active", category: "groceries", purchased: false },
      { id: "today", category: "groceries", purchased: true, purchasedOn: "2026-08-22" },
      { id: "yesterday", category: "groceries", purchased: true, purchasedOn: "2026-08-21" },
      { id: "house", category: "house", purchased: true, purchasedOn: "2026-08-21" },
    ];

    expect(clearPurchasedGroceriesFromPreviousDays(items, "2026-08-22").map((item) => item.id)).toEqual(["active", "today", "house"]);
  });
});
