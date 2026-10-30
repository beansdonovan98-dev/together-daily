import { Platform } from "react-native";
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

  let body: Blob | Uint8Array;
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    body = await response.blob();
  } else {
    const FileSystem = require("expo-file-system/legacy");
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    body = bytes;
  }

  const { data, error } = await supabase.storage.from("media").upload(path, body, {
    contentType: mimeType,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  if (!data?.path) throw new Error("Supabase did not return a storage path.");
  const { data: urlData } = supabase.storage.from("media").getPublicUrl(data.path);
  if (!urlData?.publicUrl) throw new Error("Supabase did not return a public URL for the uploaded file.");
  return urlData.publicUrl;
}

export function makeMediaId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}