import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Core account table managed by the included OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** A private journal that can be joined by exactly two invited partners. */
export const coupleSpaces = mysqlTable(
  "couple_spaces",
  {
    id: int("id").autoincrement().primaryKey(),
    displayName: varchar("displayName", { length: 120 }).notNull(),
    inviteCode: varchar("inviteCode", { length: 16 }).notNull(),
    settings: text("settings").notNull(),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("couple_spaces_invite_code_unique").on(table.inviteCode)],
);

export const coupleMembers = mysqlTable(
  "couple_members",
  {
    id: int("id").autoincrement().primaryKey(),
    coupleId: int("coupleId").notNull(),
    userId: int("userId").notNull(),
    displayName: varchar("displayName", { length: 80 }).notNull(),
    avatarEmoji: varchar("avatarEmoji", { length: 12 }).default("💜").notNull(),
    accentColor: varchar("accentColor", { length: 16 }).default("#8D5BA6").notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("couple_members_user_unique").on(table.userId),
    uniqueIndex("couple_members_pair_unique").on(table.coupleId, table.userId),
  ],
);

/** One mutable, structured journal entry is stored for every couple and calendar date. */
export const dailyLogs = mysqlTable(
  "daily_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    coupleId: int("coupleId").notNull(),
    date: varchar("date", { length: 10 }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("daily_logs_couple_date_unique").on(table.coupleId, table.date)],
);

/** Shared, chronological records cover chat, love notes, habits, plans, and opt-in intimacy notes. */
export const sharedRecords = mysqlTable("shared_records", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  authorId: int("authorId").notNull(),
  recordType: mysqlEnum("recordType", ["chat", "loveNote", "intimacy", "habit", "dateIdea"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Private photo metadata; the binary file is kept in managed object storage. */
export const mediaItems = mysqlTable("media_items", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  dailyLogId: int("dailyLogId"),
  uploadedBy: int("uploadedBy").notNull(),
  kind: mysqlEnum("kind", ["cover", "photo"]).notNull(),
  url: text("url").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  caption: text("caption"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** A no-sign-in shared journal room. The unguessable room code acts as the invite credential. */
export const guestRooms = mysqlTable(
  "guest_rooms",
  {
    id: int("id").autoincrement().primaryKey(),
    roomCode: varchar("roomCode", { length: 16 }).notNull(),
    journalState: text("journalState").notNull(),
    memberIds: varchar("memberIds", { length: 64 }).notNull().default("[]"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("guest_rooms_room_code_unique").on(table.roomCode)],
);

/** Physical-device push tokens are kept private to a shared room and partner identity. */
export const guestRoomPushTokens = mysqlTable(
  "guest_room_push_tokens",
  {
    id: int("id").autoincrement().primaryKey(),
    roomCode: varchar("roomCode", { length: 16 }).notNull(),
    partnerId: mysqlEnum("partnerId", ["beans", "princess", "rara"]).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    platform: varchar("platform", { length: 16 }).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("guest_room_push_tokens_room_partner_token_unique").on(table.roomCode, table.partnerId, table.token)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CoupleSpace = typeof coupleSpaces.$inferSelect;
export type CoupleMember = typeof coupleMembers.$inferSelect;
export type DailyLog = typeof dailyLogs.$inferSelect;
export type SharedRecord = typeof sharedRecords.$inferSelect;
export type MediaItem = typeof mediaItems.$inferSelect;
export type GuestRoom = typeof guestRooms.$inferSelect;
export type GuestRoomPushToken = typeof guestRoomPushTokens.$inferSelect;
