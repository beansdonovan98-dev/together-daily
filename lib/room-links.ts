export type LinkedRoom = { roomCode: string; memberId: string };
export type RoomLinks = Record<string, LinkedRoom[]>;

function normalizeRoomCode(value: string) {
  return value.trim().toUpperCase();
}

/** Adds a room link for each selected member without removing their existing saved rooms. */
export function addRoomLinkForMembers(
  existing: Partial<RoomLinks> | undefined,
  roomCode: string,
  memberIds: readonly string[],
): RoomLinks {
  const next: RoomLinks = {};
  Object.entries(existing ?? {}).forEach(([memberId, rooms]) => {
    if (Array.isArray(rooms)) next[memberId] = rooms;
  });
  const normalizedCode = normalizeRoomCode(roomCode);

  for (const memberId of memberIds) {
    const current = Array.isArray(next[memberId]) ? next[memberId] : [];
    const linked = { roomCode: normalizedCode, memberId };
    next[memberId] = [
      ...current.filter((room) => !(normalizeRoomCode(String(room.roomCode ?? "")) === normalizedCode && room.memberId === memberId)),
      linked,
    ];
  }

  return next;
}

export function roomLinksForMember(existing: Partial<RoomLinks> | undefined, memberId: string | null) {
  if (!memberId) return [] as LinkedRoom[];
  const rooms = existing?.[memberId];
  if (!Array.isArray(rooms)) return [] as LinkedRoom[];
  return rooms.filter((room): room is LinkedRoom => Boolean(room && typeof room.roomCode === "string" && typeof room.memberId === "string"));
}
