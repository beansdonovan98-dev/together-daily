export type RoomMemberIdentity = "beans" | "princess" | "rara";

/** Keeps the relationship room private while allowing RaRa in Friend-mode rooms. */
export function mayJoinRoom(memberId: RoomMemberIdentity, mode: unknown) {
  return memberId !== "rara" || mode === "friends";
}
