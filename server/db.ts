import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  coupleMembers,
  coupleSpaces,
  dailyLogs,
  guestRooms,
  guestRoomPushTokens,
  mediaItems,
  sharedRecords,
  type InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { buildPartnerNotification, sendPartnerPushNotifications, type PartnerNotificationEvent } from "./partner-notifications";

export type JsonObject = Record<string, unknown>;

export type ResolvedDailyLog = {
  id: number;
  coupleId: number;
  date: string;
  content: JsonObject;
  createdAt: Date;
  updatedAt: Date;
};

const QUESTION_BANK = [
  "What was a small moment today where you felt deeply loved or appreciated?",
  "What habit or quality in me has positively influenced your own life recently?",
  "How can I support you or lighten your mental load over the next 48 hours?",
  "What is your favorite quiet, unscripted memory of us from this past year?",
  "Describe our dream Sunday morning five years from now in three vivid sentences.",
  "What new experience would you love for us to try together before the year ends?",
  "What did you honestly think in the first ten minutes after we first met?",
];

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function requireDb(db: ReturnType<typeof drizzle> | null) {
  if (!db) throw new Error("Shared storage is temporarily unavailable.");
  return db;
}

function parseObject(value: string): JsonObject {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function questionForDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const epochDay = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
  const questionIndex = Math.abs(epochDay) % QUESTION_BANK.length;
  return { id: `daily-${questionIndex + 1}`, text: QUESTION_BANK[questionIndex] };
}

export function createEmptyDailyContent(date: string): JsonObject {
  const question = questionForDate(date);
  return {
    date,
    title: "Daily Check-in",
    rating: null,
    weather: null,
    tags: [],
    pinned: false,
    coverPhoto: null,
    sharedHighlight: "",
    questionId: question.id,
    questionText: question.text,
    todos: [],
    meals: {
      breakfast: "",
      breakfastDone: false,
      lunch: "",
      lunchDone: false,
      dinner: "",
      dinnerDone: false,
      prepGrocery: "",
      prepGroceryDone: false,
    },
    water: { slots: [], glassesLogged: 0, dailyGoalGlasses: 8 },
    notesList: [],
    timelineEvents: [],
    checkIns: {},
    photos: [],
    sharedNotes: "",
  };
}

function toResolvedDailyLog(row: typeof dailyLogs.$inferSelect): ResolvedDailyLog {
  return {
    id: row.id,
    coupleId: row.coupleId,
    date: row.date,
    content: parseObject(row.content),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function createInviteCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getCoupleSpaceForUser(userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select({ space: coupleSpaces, member: coupleMembers })
    .from(coupleMembers)
    .innerJoin(coupleSpaces, eq(coupleMembers.coupleId, coupleSpaces.id))
    .where(eq(coupleMembers.userId, userId))
    .limit(1);
  if (!rows[0]) return null;

  const members = await db.select().from(coupleMembers).where(eq(coupleMembers.coupleId, rows[0].space.id));
  return {
    ...rows[0].space,
    settings: parseObject(rows[0].space.settings),
    member: rows[0].member,
    members,
  };
}

export async function createCoupleSpace(
  userId: number,
  input: { displayName: string; memberName: string; avatarEmoji: string; accentColor: string },
) {
  const db = requireDb(await getDb());
  const existing = await getCoupleSpaceForUser(userId);
  if (existing) throw new Error("You are already part of a couple space.");

  const inviteCode = createInviteCode();
  const settings = JSON.stringify({ anniversaryDate: null, theme: "together-light", chatSoundEnabled: true });
  const result = await db.insert(coupleSpaces).values({
    displayName: input.displayName.trim() || "Together Daily",
    inviteCode,
    settings,
    createdBy: userId,
  });
  const coupleId = Number(result[0].insertId);
  await db.insert(coupleMembers).values({
    coupleId,
    userId,
    displayName: input.memberName.trim() || "Partner One",
    avatarEmoji: input.avatarEmoji || "💜",
    accentColor: input.accentColor || "#8D5BA6",
  });
  return getCoupleSpaceForUser(userId);
}

export async function joinCoupleSpace(
  userId: number,
  input: { inviteCode: string; memberName: string; avatarEmoji: string; accentColor: string },
) {
  const db = requireDb(await getDb());
  const existing = await getCoupleSpaceForUser(userId);
  if (existing) throw new Error("You are already part of a couple space.");

  const inviteCode = input.inviteCode.trim().toUpperCase();
  const space = await db.select().from(coupleSpaces).where(eq(coupleSpaces.inviteCode, inviteCode)).limit(1);
  if (!space[0]) throw new Error("That invite code was not found.");
  const members = await db.select().from(coupleMembers).where(eq(coupleMembers.coupleId, space[0].id));
  if (members.length >= 2) throw new Error("This couple space already has two partners.");

  await db.insert(coupleMembers).values({
    coupleId: space[0].id,
    userId,
    displayName: input.memberName.trim() || "Partner Two",
    avatarEmoji: input.avatarEmoji || "🩷",
    accentColor: input.accentColor || "#D56B88",
  });
  return getCoupleSpaceForUser(userId);
}

async function assertCoupleMember(coupleId: number, userId: number) {
  const db = requireDb(await getDb());
  const membership = await db
    .select()
    .from(coupleMembers)
    .where(and(eq(coupleMembers.coupleId, coupleId), eq(coupleMembers.userId, userId)))
    .limit(1);
  if (!membership[0]) throw new Error("You do not have access to this private couple space.");
  return membership[0];
}

async function requireCurrentCouple(userId: number) {
  const space = await getCoupleSpaceForUser(userId);
  if (!space) throw new Error("Create or join a couple space first.");
  return space;
}

export async function getDailyLogForUser(userId: number, date: string) {
  const db = requireDb(await getDb());
  const space = await requireCurrentCouple(userId);
  const existing = await db
    .select()
    .from(dailyLogs)
    .where(and(eq(dailyLogs.coupleId, space.id), eq(dailyLogs.date, date)))
    .limit(1);
  if (existing[0]) return toResolvedDailyLog(existing[0]);

  const result = await db.insert(dailyLogs).values({
    coupleId: space.id,
    date,
    content: JSON.stringify(createEmptyDailyContent(date)),
  });
  const created = await db.select().from(dailyLogs).where(eq(dailyLogs.id, Number(result[0].insertId))).limit(1);
  return toResolvedDailyLog(created[0]);
}

export async function updateDailyLogForUser(userId: number, date: string, content: JsonObject) {
  const db = requireDb(await getDb());
  const current = await getDailyLogForUser(userId, date);
  await assertCoupleMember(current.coupleId, userId);
  const merged = { ...current.content, ...content, date };
  await db.update(dailyLogs).set({ content: JSON.stringify(merged) }).where(eq(dailyLogs.id, current.id));
  return { ...current, content: merged, updatedAt: new Date() };
}

export async function listDailyLogsForUser(userId: number, limit = 45) {
  const db = requireDb(await getDb());
  const space = await requireCurrentCouple(userId);
  const rows = await db
    .select()
    .from(dailyLogs)
    .where(eq(dailyLogs.coupleId, space.id))
    .orderBy(desc(dailyLogs.date))
    .limit(Math.min(Math.max(limit, 1), 90));
  return rows.map(toResolvedDailyLog);
}

export async function listSharedRecordsForUser(
  userId: number,
  recordType: "chat" | "loveNote" | "intimacy" | "habit" | "dateIdea",
  limit = 100,
) {
  const db = requireDb(await getDb());
  const space = await requireCurrentCouple(userId);
  const rows = await db
    .select()
    .from(sharedRecords)
    .where(and(eq(sharedRecords.coupleId, space.id), eq(sharedRecords.recordType, recordType)))
    .orderBy(desc(sharedRecords.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200));
  return rows.reverse().map((row) => ({ ...row, content: parseObject(row.content) }));
}

export async function createSharedRecordForUser(
  userId: number,
  input: { recordType: "chat" | "loveNote" | "intimacy" | "habit" | "dateIdea"; content: JsonObject },
) {
  const db = requireDb(await getDb());
  const space = await requireCurrentCouple(userId);
  const result = await db.insert(sharedRecords).values({
    coupleId: space.id,
    authorId: userId,
    recordType: input.recordType,
    content: JSON.stringify(input.content),
  });
  const created = await db
    .select()
    .from(sharedRecords)
    .where(eq(sharedRecords.id, Number(result[0].insertId)))
    .limit(1);
  return { ...created[0], content: parseObject(created[0].content) };
}

export async function createMediaItemForUser(
  userId: number,
  input: {
    dailyLogId?: number | null;
    kind: "cover" | "photo";
    url: string;
    storageKey: string;
    fileName: string;
    mimeType: string;
    caption?: string;
  },
) {
  const db = requireDb(await getDb());
  const space = await requireCurrentCouple(userId);
  if (input.dailyLogId) {
    const log = await db.select().from(dailyLogs).where(eq(dailyLogs.id, input.dailyLogId)).limit(1);
    if (!log[0] || log[0].coupleId !== space.id) throw new Error("That daily log is not part of your couple space.");
  }
  const result = await db.insert(mediaItems).values({
    coupleId: space.id,
    dailyLogId: input.dailyLogId ?? null,
    uploadedBy: userId,
    kind: input.kind,
    url: input.url,
    storageKey: input.storageKey,
    fileName: input.fileName,
    mimeType: input.mimeType,
    caption: input.caption ?? "",
  });
  const created = await db.select().from(mediaItems).where(eq(mediaItems.id, Number(result[0].insertId))).limit(1);
  return created[0];
}

export async function listMediaForUser(userId: number, date?: string) {
  const db = requireDb(await getDb());
  const space = await requireCurrentCouple(userId);
  if (!date) {
    return db.select().from(mediaItems).where(eq(mediaItems.coupleId, space.id)).orderBy(desc(mediaItems.createdAt)).limit(120);
  }
  const log = await getDailyLogForUser(userId, date);
  return db.select().from(mediaItems).where(eq(mediaItems.dailyLogId, log.id)).orderBy(desc(mediaItems.createdAt));
}

function createGuestRoomCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

type GuestRoomMemberId = "beans" | "princess";

function parseGuestRoomMembers(value: string): GuestRoomMemberId[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((member): member is GuestRoomMemberId => member === "beans" || member === "princess");
  } catch {
    return [];
  }
}

function toGuestRoomResponse(room: typeof guestRooms.$inferSelect) {
  return {
    roomCode: room.roomCode,
    journalState: parseObject(room.journalState),
    memberIds: parseGuestRoomMembers(room.memberIds),
    updatedAt: room.updatedAt,
  };
}

async function notifyGuestRoomPartner(roomCode: string, actorId: GuestRoomMemberId, event: PartnerNotificationEvent) {
  const db = await getDb();
  if (!db) return;

  const tokens = await db.select().from(guestRoomPushTokens).where(eq(guestRoomPushTokens.roomCode, roomCode));
  const recipientTokens = tokens.filter((entry) => entry.enabled && entry.partnerId !== actorId).map((entry) => entry.token);
  if (!recipientTokens.length) return;

  try {
    await sendPartnerPushNotifications(recipientTokens, buildPartnerNotification(event, actorId));
  } catch (error) {
    console.warn("[Push] Partner notification could not be delivered:", error);
  }
}

export async function createGuestRoom(journalState: JsonObject, memberId: GuestRoomMemberId) {
  const db = requireDb(await getDb());
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const roomCode = createGuestRoomCode();
    try {
      const result = await db.insert(guestRooms).values({
        roomCode,
        journalState: JSON.stringify(journalState),
        memberIds: JSON.stringify([memberId]),
      });
      const created = await db.select().from(guestRooms).where(eq(guestRooms.id, Number(result[0].insertId))).limit(1);
      return toGuestRoomResponse(created[0]);
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  throw new Error("Unable to create a shared room.");
}

export async function getGuestRoom(roomCode: string) {
  const db = requireDb(await getDb());
  const found = await db.select().from(guestRooms).where(eq(guestRooms.roomCode, roomCode.trim().toUpperCase())).limit(1);
  if (!found[0]) throw new Error("That shared room code was not found.");
  return toGuestRoomResponse(found[0]);
}

export async function joinGuestRoom(roomCode: string, memberId: GuestRoomMemberId) {
  const db = requireDb(await getDb());
  const normalizedCode = roomCode.trim().toUpperCase();
  const found = await db.select().from(guestRooms).where(eq(guestRooms.roomCode, normalizedCode)).limit(1);
  if (!found[0]) throw new Error("That shared room code was not found.");

  const currentMembers = parseGuestRoomMembers(found[0].memberIds);
  if (!currentMembers.includes(memberId) && currentMembers.length >= 2) {
    throw new Error("That private room already has two connected partners.");
  }

  const memberIds = currentMembers.includes(memberId) ? currentMembers : [...currentMembers, memberId];
  if (memberIds.length !== currentMembers.length) {
    await db.update(guestRooms).set({ memberIds: JSON.stringify(memberIds) }).where(eq(guestRooms.roomCode, normalizedCode));
    await notifyGuestRoomPartner(normalizedCode, memberId, "connection");
  }

  return { ...toGuestRoomResponse(found[0]), memberIds };
}

export async function registerGuestRoomPushToken(input: { roomCode: string; partnerId: GuestRoomMemberId; token: string; platform: string }) {
  const db = requireDb(await getDb());
  const roomCode = input.roomCode.trim().toUpperCase();
  const room = await db.select().from(guestRooms).where(eq(guestRooms.roomCode, roomCode)).limit(1);
  if (!room[0]) throw new Error("That shared room code was not found.");

  await db.insert(guestRoomPushTokens).values({ ...input, roomCode, enabled: true }).onDuplicateKeyUpdate({
    set: { platform: input.platform, enabled: true, updatedAt: new Date() },
  });
  return { registered: true } as const;
}

export async function updateGuestRoom(roomCode: string, journalState: JsonObject, actorId?: GuestRoomMemberId, notificationType?: PartnerNotificationEvent) {
  const db = requireDb(await getDb());
  const normalizedCode = roomCode.trim().toUpperCase();
  const existing = await db.select().from(guestRooms).where(eq(guestRooms.roomCode, normalizedCode)).limit(1);
  if (!existing[0]) throw new Error("That shared room code was not found.");
  await db.update(guestRooms).set({ journalState: JSON.stringify(journalState) }).where(eq(guestRooms.roomCode, normalizedCode));
  if (actorId && notificationType) await notifyGuestRoomPartner(normalizedCode, actorId, notificationType);
  return { roomCode: normalizedCode, journalState, memberIds: parseGuestRoomMembers(existing[0].memberIds), updatedAt: new Date() };
}

export async function addGuestRoomPrivateMedia(input: {
  roomCode: string;
  partnerId: GuestRoomMemberId;
  media: JsonObject;
}) {
  const db = requireDb(await getDb());
  const roomCode = input.roomCode.trim().toUpperCase();
  const existing = await db.select().from(guestRooms).where(eq(guestRooms.roomCode, roomCode)).limit(1);
  if (!existing[0]) throw new Error("That shared room code was not found.");
  const memberIds = parseGuestRoomMembers(existing[0].memberIds);
  if (!memberIds.includes(input.partnerId)) throw new Error("Join this shared room before adding private media.");

  const journalState = parseObject(existing[0].journalState);
  const media = Array.isArray(journalState.media) ? journalState.media : [];
  const nextState = { ...journalState, media: [input.media, ...media] };
  await db.update(guestRooms).set({ journalState: JSON.stringify(nextState) }).where(eq(guestRooms.roomCode, roomCode));
  await notifyGuestRoomPartner(roomCode, input.partnerId, "private-update");
  return { roomCode, journalState: nextState, memberIds, updatedAt: new Date(), media: input.media };
}

export async function addGuestRoomDailyCover(input: {
  roomCode: string;
  partnerId: GuestRoomMemberId;
  dailyDate: string;
  slot: "first" | "second";
  media: JsonObject;
}) {
  const db = requireDb(await getDb());
  const roomCode = input.roomCode.trim().toUpperCase();
  const existing = await db.select().from(guestRooms).where(eq(guestRooms.roomCode, roomCode)).limit(1);
  if (!existing[0]) throw new Error("That shared room code was not found.");
  const memberIds = parseGuestRoomMembers(existing[0].memberIds);
  if (!memberIds.includes(input.partnerId)) throw new Error("Join this shared room before adding a cover photo.");

  const journalState = parseObject(existing[0].journalState);
  const days = journalState.days && typeof journalState.days === "object" && !Array.isArray(journalState.days) ? journalState.days as JsonObject : {};
  const currentDay = days[input.dailyDate] && typeof days[input.dailyDate] === "object" && !Array.isArray(days[input.dailyDate]) ? days[input.dailyDate] as JsonObject : { date: input.dailyDate };
  const coverKey = input.slot === "first" ? "coverPhoto" : "coverPhotoTwo";
  const existingMedia = Array.isArray(journalState.media) ? journalState.media : [];
  // Cover records were historically embedded as data URLs. They have no gallery UI, so dropping
  // legacy cover records prevents old multi-megabyte payloads from overwriting this durable update.
  const media = existingMedia.filter((item) => !(item && typeof item === "object" && (item as JsonObject).kind === "cover"));
  const nextState = {
    ...journalState,
    days: { ...days, [input.dailyDate]: { ...currentDay, date: input.dailyDate, [coverKey]: input.media } },
    media: [input.media, ...media],
  };
  await db.update(guestRooms).set({ journalState: JSON.stringify(nextState) }).where(eq(guestRooms.roomCode, roomCode));
  await notifyGuestRoomPartner(roomCode, input.partnerId, "daily-log");
  return { roomCode, journalState: nextState, memberIds, updatedAt: new Date(), media: input.media };
}

export async function deleteGuestRoomDailyCover(input: {
  roomCode: string;
  partnerId: GuestRoomMemberId;
  dailyDate: string;
  slot: "first" | "second";
}) {
  const db = requireDb(await getDb());
  const roomCode = input.roomCode.trim().toUpperCase();
  const existing = await db.select().from(guestRooms).where(eq(guestRooms.roomCode, roomCode)).limit(1);
  if (!existing[0]) throw new Error("That shared room code was not found.");
  const memberIds = parseGuestRoomMembers(existing[0].memberIds);
  if (!memberIds.includes(input.partnerId)) throw new Error("Join this shared room before removing a cover photo.");

  const journalState = parseObject(existing[0].journalState);
  const days = journalState.days && typeof journalState.days === "object" && !Array.isArray(journalState.days) ? journalState.days as JsonObject : {};
  const currentDay = days[input.dailyDate] && typeof days[input.dailyDate] === "object" && !Array.isArray(days[input.dailyDate]) ? days[input.dailyDate] as JsonObject : null;
  const coverKey = input.slot === "first" ? "coverPhoto" : "coverPhotoTwo";
  const cover = currentDay?.[coverKey];
  if (!currentDay || !cover || typeof cover !== "object") throw new Error("That cover photo is no longer available.");

  const { [coverKey]: _removedCover, ...remainingDay } = currentDay;
  const coverId = (cover as JsonObject).id;
  const existingMedia = Array.isArray(journalState.media) ? journalState.media : [];
  const media = existingMedia.filter((item) => !(item && typeof item === "object" && (item as JsonObject).kind === "cover" && (item as JsonObject).id === coverId));
  const nextState = { ...journalState, days: { ...days, [input.dailyDate]: { ...remainingDay, date: input.dailyDate } }, media };
  await db.update(guestRooms).set({ journalState: JSON.stringify(nextState) }).where(eq(guestRooms.roomCode, roomCode));
  await notifyGuestRoomPartner(roomCode, input.partnerId, "daily-log");
  return { roomCode, journalState: nextState, memberIds, updatedAt: new Date() };
}

export async function deleteGuestRoomPrivateMedia(input: { roomCode: string; partnerId: GuestRoomMemberId; mediaId: string }) {
  const db = requireDb(await getDb());
  const roomCode = input.roomCode.trim().toUpperCase();
  const existing = await db.select().from(guestRooms).where(eq(guestRooms.roomCode, roomCode)).limit(1);
  if (!existing[0]) throw new Error("That shared room code was not found.");
  const memberIds = parseGuestRoomMembers(existing[0].memberIds);
  if (!memberIds.includes(input.partnerId)) throw new Error("Join this shared room before removing private media.");

  const journalState = parseObject(existing[0].journalState);
  const media = Array.isArray(journalState.media) ? journalState.media : [];
  const nextMedia = media.filter((item) => !(item && typeof item === "object" && (item as Record<string, unknown>).id === input.mediaId && (item as Record<string, unknown>).kind === "private"));
  if (nextMedia.length === media.length) throw new Error("That private photo is no longer available.");
  const nextState = { ...journalState, media: nextMedia };
  await db.update(guestRooms).set({ journalState: JSON.stringify(nextState) }).where(eq(guestRooms.roomCode, roomCode));
  await notifyGuestRoomPartner(roomCode, input.partnerId, "private-update");
  return { roomCode, journalState: nextState, memberIds, updatedAt: new Date() };
}

export async function updateGuestRoomPrivateMediaCaption(input: { roomCode: string; partnerId: GuestRoomMemberId; mediaId: string; caption: string }) {
  const db = requireDb(await getDb());
  const roomCode = input.roomCode.trim().toUpperCase();
  const existing = await db.select().from(guestRooms).where(eq(guestRooms.roomCode, roomCode)).limit(1);
  if (!existing[0]) throw new Error("That shared room code was not found.");
  const memberIds = parseGuestRoomMembers(existing[0].memberIds);
  if (!memberIds.includes(input.partnerId)) throw new Error("Join this shared room before editing private media.");

  const journalState = parseObject(existing[0].journalState);
  const media = Array.isArray(journalState.media) ? journalState.media : [];
  let found = false;
  const nextMedia = media.map((item) => {
    if (!item || typeof item !== "object") return item;
    const current = item as Record<string, unknown>;
    if (current.id !== input.mediaId || current.kind !== "private") return item;
    found = true;
    return { ...current, caption: input.caption };
  });
  if (!found) throw new Error("That private photo is no longer available.");
  const nextState = { ...journalState, media: nextMedia };
  await db.update(guestRooms).set({ journalState: JSON.stringify(nextState) }).where(eq(guestRooms.roomCode, roomCode));
  await notifyGuestRoomPartner(roomCode, input.partnerId, "private-update");
  return { roomCode, journalState: nextState, memberIds, updatedAt: new Date() };
}
