import { describe, expect, it } from "vitest";

import { addRoomLinkForMembers, roomLinksForMember } from "../lib/room-links";

describe("shared room links", () => {
  it("shares a new room link with both couple members while retaining existing rooms", () => {
    const links = addRoomLinkForMembers(
      { beans: [{ roomCode: "LOVE1111", memberId: "beans" }] },
      "group2222",
      ["beans", "princess", "rara"],
    );

    expect(roomLinksForMember(links, "beans")).toEqual([{ roomCode: "LOVE1111", memberId: "beans" }, { roomCode: "GROUP2222", memberId: "beans" }]);
    expect(roomLinksForMember(links, "princess")).toEqual([{ roomCode: "GROUP2222", memberId: "princess" }]);
    expect(roomLinksForMember(links, "rara")).toEqual([{ roomCode: "GROUP2222", memberId: "rara" }]);
  });

  it("updates a room link without creating duplicates", () => {
    const links = addRoomLinkForMembers(
      { princess: [{ roomCode: "GROUP2222", memberId: "princess" }] },
      "group2222",
      ["princess"],
    );

    expect(roomLinksForMember(links, "princess")).toEqual([{ roomCode: "GROUP2222", memberId: "princess" }]);
  });
});
