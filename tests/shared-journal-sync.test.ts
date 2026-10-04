import { describe, expect, it } from "vitest";

import {
  REMOTE_SNAPSHOT_SETTLE_MS,
  mergeForegroundUsageIntoJournal,
  shouldApplySharedRoomSnapshot,
} from "../lib/shared-journal-sync";

describe("shared journal typing protection", () => {
  it("does not apply a polling response while a newer local draft is waiting to sync", () => {
    expect(shouldApplySharedRoomSnapshot({
      localSerialized: '{"draft":"new text"}',
      incomingSerialized: '{"draft":"old text"}',
      hasPendingLocalWrite: true,
      lastLocalWriteAt: 1_000,
      now: 10_000,
    })).toBe(false);
  });

  it("does not apply a just-started stale poll after a local keystroke", () => {
    expect(shouldApplySharedRoomSnapshot({
      localSerialized: '{"draft":"new text"}',
      incomingSerialized: '{"draft":"old text"}',
      hasPendingLocalWrite: false,
      lastLocalWriteAt: 2_000,
      now: 2_000 + REMOTE_SNAPSHOT_SETTLE_MS - 1,
    })).toBe(false);

    expect(shouldApplySharedRoomSnapshot({
      localSerialized: '{"draft":"new text"}',
      incomingSerialized: '{"draft":"partner text"}',
      hasPendingLocalWrite: false,
      lastLocalWriteAt: 2_000,
      now: 2_000 + REMOTE_SNAPSHOT_SETTLE_MS,
    })).toBe(true);
  });

  it("refreshes only app-time totals without replacing local text drafts", () => {
    const local = {
      days: {
        "2026-10-04": {
          date: "2026-10-04",
          meals: { breakfast: "typing ome" },
          appUsage: { beans: 21_000, princess: 5_000 },
        },
      },
    };
    const server = {
      days: {
        "2026-10-04": {
          date: "2026-10-04",
          meals: { breakfast: "old" },
          appUsage: { beans: 36_000, princess: 5_000 },
        },
      },
    };

    const next = mergeForegroundUsageIntoJournal(local, server);
    expect(next.days["2026-10-04"].meals).toEqual({ breakfast: "typing ome" });
    expect(next.days["2026-10-04"].appUsage).toEqual({ beans: 36_000, princess: 5_000 });
  });
});
