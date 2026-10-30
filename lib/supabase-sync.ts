import { supabase, isSupabaseConfigured, type GuestRoomRow } from "./supabase";
import type { JournalState } from "./local-journal";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createGuestRoom(journalState: JournalState, memberId: string): Promise<{ roomCode: string; memberIds: string[] }> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const roomCode = generateRoomCode();
  const { error } = await supabase.from("guest_rooms").insert({
    room_code: roomCode,
    journal_state: journalState,
    members: [memberId],
  });
  if (error) throw new Error(error.message);
  return { roomCode, memberIds: [memberId] };
}

export async function getGuestRoom(roomCode: string): Promise<{ journalState: JournalState; memberIds: string[] } | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("guest_rooms")
    .select("journal_state, members")
    .eq("room_code", roomCode)
    .single();
  if (error || !data) return null;
  return { journalState: data.journal_state as JournalState, memberIds: data.members as string[] };
}

export async function joinGuestRoom(roomCode: string, memberId: string): Promise<{ memberIds: string[] }> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const room = await getGuestRoom(roomCode);
  if (!room) throw new Error("Room not found.");
  const members = room.memberIds.includes(memberId) ? room.memberIds : [...room.memberIds, memberId];
  const { error } = await supabase
    .from("guest_rooms")
    .update({ members, updated_at: new Date().toISOString() })
    .eq("room_code", roomCode);
  if (error) throw new Error(error.message);
  return { memberIds: members };
}

export async function updateGuestRoom(roomCode: string, journalState: JournalState): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from("guest_rooms")
    .update({ journal_state: journalState, updated_at: new Date().toISOString() })
    .eq("room_code", roomCode);
  if (error) throw new Error(error.message);
}

export async function uploadToSupabaseStorage(uri: string, path: string, mimeType: string): Promise<string> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const response = await fetch(uri);
  const blob = await response.blob();
  const { data, error } = await supabase.storage.from("media").upload(path, blob, {
    contentType: mimeType,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  const { data: urlData } = supabase.storage.from("media").getPublicUrl(data.path);
  return urlData.publicUrl;
}