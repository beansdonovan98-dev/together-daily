import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storageCreateDirectUpload, storageGet, storagePut } from "./storage";
import { maxBase64LengthForMedia, maxStoredBytesForMedia } from "../lib/media-upload-policy";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD calendar date.");
const jsonObjectSchema = z.record(z.string(), z.unknown());
const recordTypeSchema = z.enum(["chat", "loveNote", "intimacy", "habit", "dateIdea"]);
const imageMimeTypeSchema = z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const guestMemberIdSchema = z.enum(["beans", "princess"]);
const partnerNotificationTypeSchema = z.enum(["connection", "daily-log", "love-note", "todo", "private-update", "steamy-update"]);

function safeFileName(fileName: string) {
  const normalized = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return normalized.slice(-120) || "photo.jpg";
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  couple: router({
    mine: protectedProcedure.query(({ ctx }) => db.getCoupleSpaceForUser(ctx.user.id)),
    create: protectedProcedure
      .input(
        z.object({
          displayName: z.string().trim().max(120),
          memberName: z.string().trim().max(80),
          avatarEmoji: z.string().trim().max(12).default("💜"),
          accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#8D5BA6"),
        }),
      )
      .mutation(({ ctx, input }) => db.createCoupleSpace(ctx.user.id, input)),
    join: protectedProcedure
      .input(
        z.object({
          inviteCode: z.string().trim().min(6).max(16),
          memberName: z.string().trim().max(80),
          avatarEmoji: z.string().trim().max(12).default("🩷"),
          accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#D56B88"),
        }),
      )
      .mutation(({ ctx, input }) => db.joinCoupleSpace(ctx.user.id, input)),
  }),

  daily: router({
    get: protectedProcedure.input(z.object({ date: dateSchema })).query(({ ctx, input }) => db.getDailyLogForUser(ctx.user.id, input.date)),
    update: protectedProcedure
      .input(z.object({ date: dateSchema, content: jsonObjectSchema }))
      .mutation(({ ctx, input }) => db.updateDailyLogForUser(ctx.user.id, input.date, input.content)),
    list: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(90).optional() }).optional())
      .query(({ ctx, input }) => db.listDailyLogsForUser(ctx.user.id, input?.limit)),
  }),

  records: router({
    list: protectedProcedure
      .input(z.object({ recordType: recordTypeSchema, limit: z.number().int().min(1).max(200).optional() }))
      .query(({ ctx, input }) => db.listSharedRecordsForUser(ctx.user.id, input.recordType, input.limit)),
    create: protectedProcedure
      .input(z.object({ recordType: recordTypeSchema, content: jsonObjectSchema }))
      .mutation(({ ctx, input }) => db.createSharedRecordForUser(ctx.user.id, input)),
  }),

  media: router({
    list: protectedProcedure
      .input(z.object({ date: dateSchema.optional() }).optional())
      .query(({ ctx, input }) => db.listMediaForUser(ctx.user.id, input?.date)),
    upload: protectedProcedure
      .input(
        z.object({
          date: dateSchema,
          kind: z.enum(["cover", "photo"]),
          fileName: z.string().min(1).max(255),
          mimeType: imageMimeTypeSchema,
          base64: z.string().min(1).max(84_000_000),
          caption: z.string().max(500).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const bytes = Buffer.from(input.base64, "base64");
        if (bytes.byteLength > maxStoredBytesForMedia(input.mimeType, "cover")) throw new Error(input.mimeType === "image/gif" ? "Please choose a GIF smaller than 60 MB." : "Please choose a photo smaller than 2.5 MB.");
        const log = await db.getDailyLogForUser(ctx.user.id, input.date);
        const fileName = safeFileName(input.fileName);
        const storageKey = `couples/${log.coupleId}/photos/${Date.now()}-${fileName}`;
        const stored = await storagePut(storageKey, bytes, input.mimeType);
        return db.createMediaItemForUser(ctx.user.id, {
          dailyLogId: log.id,
          kind: input.kind,
          url: stored.url,
          storageKey: stored.key,
          fileName,
          mimeType: input.mimeType,
          caption: input.caption,
        });
      }),
  }),

  guestRoom: router({
    create: publicProcedure.input(z.object({ journalState: jsonObjectSchema, memberId: guestMemberIdSchema })).mutation(({ input }) => db.createGuestRoom(input.journalState, input.memberId)),
    get: publicProcedure.input(z.object({ roomCode: z.string().trim().min(8).max(16) })).query(({ input }) => db.getGuestRoom(input.roomCode)),
    join: publicProcedure.input(z.object({ roomCode: z.string().trim().min(8).max(16), memberId: guestMemberIdSchema })).mutation(({ input }) => db.joinGuestRoom(input.roomCode, input.memberId)),
    registerPushToken: publicProcedure.input(z.object({ roomCode: z.string().trim().min(8).max(16), partnerId: guestMemberIdSchema, token: z.string().regex(/^(ExponentPushToken|ExpoPushToken)\[.+\]$/), platform: z.enum(["android", "ios"]) })).mutation(({ input }) => db.registerGuestRoomPushToken(input)),
    getPushStatus: publicProcedure.input(z.object({ roomCode: z.string().trim().min(8).max(16), partnerId: guestMemberIdSchema })).query(({ input }) => db.getGuestRoomPushStatus(input.roomCode, input.partnerId)),
    sendTestPartnerAlert: publicProcedure.input(z.object({ roomCode: z.string().trim().min(8).max(16), partnerId: guestMemberIdSchema })).mutation(({ input }) => db.sendGuestRoomPartnerTestAlert(input.roomCode, input.partnerId)),
    requestPrivateMediaDirectUpload: publicProcedure
      .input(z.object({ roomCode: z.string().trim().min(8).max(16), partnerId: guestMemberIdSchema, fileName: z.string().min(1).max(255), mimeType: imageMimeTypeSchema, byteSize: z.number().int().positive().max(60 * 1024 * 1024) }))
      .mutation(async ({ input }) => {
        const roomCode = await db.assertGuestRoomMember(input.roomCode, input.partnerId);
        if (input.byteSize > maxStoredBytesForMedia(input.mimeType, "private")) throw new Error(input.mimeType === "image/gif" ? "Please choose a private GIF smaller than 60 MB." : "Please choose a private photo smaller than 5 MB.");
        const fileName = safeFileName(input.fileName);
        return storageCreateDirectUpload(`guest-rooms/${roomCode}/private/${Date.now()}-${fileName}`);
      }),
    confirmPrivateMediaDirectUpload: publicProcedure
      .input(z.object({ roomCode: z.string().trim().min(8).max(16), partnerId: guestMemberIdSchema, dailyDate: dateSchema, fileName: z.string().min(1).max(255), mimeType: imageMimeTypeSchema, storageKey: z.string().min(1).max(600), caption: z.string().max(500).optional(), width: z.number().positive().max(20_000).optional(), height: z.number().positive().max(20_000).optional() }))
      .mutation(async ({ input }) => {
        const roomCode = await db.assertGuestRoomMember(input.roomCode, input.partnerId);
        const privatePrefix = `guest-rooms/${roomCode}/private/`;
        if (!input.storageKey.startsWith(privatePrefix)) throw new Error("This private upload does not belong to your shared room.");
        const stored = await storageGet(input.storageKey);
        const media = {
          id: `media-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
          kind: "private",
          url: stored.url,
          storageKey: stored.key,
          fileName: safeFileName(input.fileName),
          mimeType: input.mimeType,
          caption: input.caption ?? "",
          width: input.width,
          height: input.height,
          createdAt: new Date().toISOString(),
          dailyDate: input.dailyDate,
          uploadedBy: input.partnerId,
        };
        return db.addGuestRoomPrivateMedia({ roomCode, partnerId: input.partnerId, media });
      }),
    uploadCalendarBackground: publicProcedure
      .input(z.object({ roomCode: z.string().trim().min(8).max(16), partnerId: guestMemberIdSchema, fileName: z.string().min(1).max(255), mimeType: imageMimeTypeSchema, base64: z.string().min(1).max(84_000_000), width: z.number().positive().max(20_000).optional(), height: z.number().positive().max(20_000).optional() }))
      .mutation(async ({ input }) => {
        const bytes = Buffer.from(input.base64, "base64");
        if (input.base64.length > maxBase64LengthForMedia(input.mimeType, "cover")) throw new Error("Please choose a smaller Calendar image or GIF.");
        if (bytes.byteLength > maxStoredBytesForMedia(input.mimeType, "cover")) throw new Error(input.mimeType === "image/gif" ? "Please choose a Calendar GIF smaller than 60 MB." : "Please choose a Calendar background smaller than 2.5 MB.");
        const fileName = safeFileName(input.fileName);
        const stored = await storagePut(`guest-rooms/${input.roomCode.trim().toUpperCase()}/calendar/${Date.now()}-${fileName}`, bytes, input.mimeType);
        const background = { id: `calendar-background-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, kind: "calendar", url: stored.url, storageKey: stored.key, fileName, mimeType: input.mimeType, caption: "", width: input.width, height: input.height, createdAt: new Date().toISOString(), dailyDate: "calendar", uploadedBy: input.partnerId };
        return db.setGuestRoomCalendarBackground({ roomCode: input.roomCode, partnerId: input.partnerId, background });
      }),
    deleteCalendarBackground: publicProcedure
      .input(z.object({ roomCode: z.string().trim().min(8).max(16), partnerId: guestMemberIdSchema }))
      .mutation(({ input }) => db.setGuestRoomCalendarBackground({ roomCode: input.roomCode, partnerId: input.partnerId })),
    uploadPrivateMedia: publicProcedure
      .input(z.object({ roomCode: z.string().trim().min(8).max(16), partnerId: guestMemberIdSchema, dailyDate: dateSchema, fileName: z.string().min(1).max(255), mimeType: imageMimeTypeSchema, base64: z.string().min(1).max(84_000_000), caption: z.string().max(500).optional(), width: z.number().positive().max(20_000).optional(), height: z.number().positive().max(20_000).optional() }))
      .mutation(async ({ input }) => {
        const bytes = Buffer.from(input.base64, "base64");
        if (input.base64.length > maxBase64LengthForMedia(input.mimeType, "private")) throw new Error("Please choose a smaller private photo or GIF.");
        if (bytes.byteLength > maxStoredBytesForMedia(input.mimeType, "private")) throw new Error(input.mimeType === "image/gif" ? "Please choose a private GIF smaller than 60 MB." : "Please choose a private photo smaller than 5 MB.");
        const fileName = safeFileName(input.fileName);
        const stored = await storagePut(`guest-rooms/${input.roomCode.trim().toUpperCase()}/private/${Date.now()}-${fileName}`, bytes, input.mimeType);
        const media = {
          id: `media-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
          kind: "private",
          url: stored.url,
          storageKey: stored.key,
          fileName,
          mimeType: input.mimeType,
          caption: input.caption ?? "",
          width: input.width,
          height: input.height,
          createdAt: new Date().toISOString(),
          dailyDate: input.dailyDate,
          uploadedBy: input.partnerId,
        };
        return db.addGuestRoomPrivateMedia({ roomCode: input.roomCode, partnerId: input.partnerId, media });
      }),
    uploadDailyCover: publicProcedure
      .input(z.object({ roomCode: z.string().trim().min(8).max(16), partnerId: guestMemberIdSchema, dailyDate: dateSchema, slot: z.enum(["first", "second"]), fileName: z.string().min(1).max(255), mimeType: imageMimeTypeSchema, base64: z.string().min(1).max(84_000_000), caption: z.string().max(500).optional() }))
      .mutation(async ({ input }) => {
        const bytes = Buffer.from(input.base64, "base64");
        if (input.base64.length > maxBase64LengthForMedia(input.mimeType, "cover")) throw new Error("Please choose a smaller cover photo or GIF.");
        if (bytes.byteLength > maxStoredBytesForMedia(input.mimeType, "cover")) throw new Error(input.mimeType === "image/gif" ? "Please choose a cover GIF smaller than 60 MB." : "Please choose a smaller cover photo.");
        const fileName = safeFileName(input.fileName);
        const stored = await storagePut(`guest-rooms/${input.roomCode.trim().toUpperCase()}/covers/${input.dailyDate}/${Date.now()}-${fileName}`, bytes, input.mimeType);
        const media = {
          id: `media-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
          kind: "cover",
          url: stored.url,
          storageKey: stored.key,
          fileName,
          mimeType: input.mimeType,
          caption: input.caption ?? "",
          createdAt: new Date().toISOString(),
          dailyDate: input.dailyDate,
          uploadedBy: input.partnerId,
        };
        return db.addGuestRoomDailyCover({ roomCode: input.roomCode, partnerId: input.partnerId, dailyDate: input.dailyDate, slot: input.slot, media });
      }),
    deleteDailyCover: publicProcedure
      .input(z.object({ roomCode: z.string().trim().min(8).max(16), partnerId: guestMemberIdSchema, dailyDate: dateSchema, slot: z.enum(["first", "second"]) }))
      .mutation(({ input }) => db.deleteGuestRoomDailyCover(input)),
    deletePrivateMedia: publicProcedure
      .input(z.object({ roomCode: z.string().trim().min(8).max(16), partnerId: guestMemberIdSchema, mediaId: z.string().trim().min(1).max(120) }))
      .mutation(({ input }) => db.deleteGuestRoomPrivateMedia(input)),
    updatePrivateMediaCaption: publicProcedure
      .input(z.object({ roomCode: z.string().trim().min(8).max(16), partnerId: guestMemberIdSchema, mediaId: z.string().trim().min(1).max(120), caption: z.string().trim().max(500) }))
      .mutation(({ input }) => db.updateGuestRoomPrivateMediaCaption(input)),
    addPrivateMediaComment: publicProcedure
      .input(z.object({ roomCode: z.string().trim().min(8).max(16), partnerId: guestMemberIdSchema, mediaId: z.string().trim().min(1).max(120), text: z.string().trim().min(1).max(500) }))
      .mutation(({ input }) => db.addGuestRoomPrivateMediaComment(input)),
    deletePrivateMediaComment: publicProcedure
      .input(z.object({ roomCode: z.string().trim().min(8).max(16), partnerId: guestMemberIdSchema, mediaId: z.string().trim().min(1).max(120), commentId: z.string().trim().min(1).max(160) }))
      .mutation(({ input }) => db.deleteGuestRoomPrivateMediaComment(input)),
    markPrivateMediaCommentsViewed: publicProcedure
      .input(z.object({ roomCode: z.string().trim().min(8).max(16), partnerId: guestMemberIdSchema, mediaId: z.string().trim().min(1).max(120) }))
      .mutation(({ input }) => db.markGuestRoomPrivateMediaCommentsViewed(input)),
    addWeeklyCleaningTask: publicProcedure
      .input(z.object({ roomCode: z.string().trim().min(8).max(16), partnerId: guestMemberIdSchema, weekStart: dateSchema, text: z.string().trim().min(1).max(240) }))
      .mutation(({ input }) => db.addGuestRoomWeeklyCleaningTask(input)),
    update: publicProcedure
      .input(z.object({ roomCode: z.string().trim().min(8).max(16), journalState: jsonObjectSchema, actorId: guestMemberIdSchema.optional(), notificationType: partnerNotificationTypeSchema.optional() }))
      .mutation(({ input }) => db.updateGuestRoom(input.roomCode, input.journalState, input.actorId, input.notificationType)),
  }),
});

export type AppRouter = typeof appRouter;
