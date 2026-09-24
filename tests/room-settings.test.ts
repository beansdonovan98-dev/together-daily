import { describe, expect, it } from "vitest";

import {
  defaultRoomSettings,
  normalizeRoomSettings,
  setDailyRelationshipSection,
  setRoomMode,
  setRoomPageVisibility,
  shouldShowRoomPage,
} from "../lib/room-settings";

describe("shared room configuration", () => {
  it("starts a friends room without private relationship-only pages or sections", () => {
    const friends = defaultRoomSettings("friends");

    expect(friends.visibleTabs.steamy).toBe(false);
    expect(friends.dailyRelationshipSections.relationshipTracker).toBe(false);
    expect(friends.dailyRelationshipSections.loveNotes).toBe(false);
    expect(shouldShowRoomPage(friends, "themes")).toBe(true);
  });

  it("allows any standard page and Daily relationship section to be toggled", () => {
    const couple = defaultRoomSettings();
    const configured = setDailyRelationshipSection(
      setRoomPageVisibility(couple, "calendar", false),
      "loveNotes",
      false,
    );

    expect(configured.visibleTabs.calendar).toBe(false);
    expect(configured.dailyRelationshipSections.loveNotes).toBe(false);
    expect(shouldShowRoomPage(configured, "calendar")).toBe(false);
  });

  it("switches room modes without losing a custom visible page choice", () => {
    const original = setRoomPageVisibility(defaultRoomSettings(), "calendar", false);
    const friends = setRoomMode(original, "friends");

    expect(friends.mode).toBe("friends");
    expect(friends.visibleTabs.calendar).toBe(false);
    expect(friends.visibleTabs.steamy).toBe(false);
  });

  it("normalizes legacy rooms safely", () => {
    const normalized = normalizeRoomSettings({ visibleTabs: { calendar: false } });

    expect(normalized.mode).toBe("couple");
    expect(normalized.visibleTabs.calendar).toBe(false);
    expect(normalized.visibleTabs.steamy).toBe(true);
  });
});
