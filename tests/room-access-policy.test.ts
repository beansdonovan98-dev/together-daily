import { describe, expect, it } from "vitest";

import { mayJoinRoom } from "../lib/room-access-policy";

describe("relationship room access policy", () => {
  it("keeps RaRa out of a relationship room", () => {
    expect(mayJoinRoom("beans", "couple")).toBe(true);
    expect(mayJoinRoom("princess", "couple")).toBe(true);
    expect(mayJoinRoom("rara", "couple")).toBe(false);
  });

  it("allows all three members in a Friend mode room", () => {
    expect(mayJoinRoom("beans", "friends")).toBe(true);
    expect(mayJoinRoom("princess", "friends")).toBe(true);
    expect(mayJoinRoom("rara", "friends")).toBe(true);
  });
});
