import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { createGuestRoom as sbCreateRoom, getGuestRoom as sbGetRoom, joinGuestRoom as sbJoinRoom, updateGuestRoom as sbUpdateRoom, uploadToSupabaseStorage, deleteFromSupabaseStorage } from "@/lib/supabase-sync";
import { uploadPickedImageDirect } from "@/lib/media-base64";
import { localDateKey } from "@/lib/together";
import { clearPurchasedGroceriesFromPreviousDays } from "@/lib/purchase-utils";
import { carryDailyHealthTasks, freshDailyFoodState } from "@/lib/daily-health-rollover";
import { carryDailyHabitList } from "@/lib/daily-habits-rollover";
import { recolorSavedLogStyle } from "@/lib/log-style-utils";
import { clearPageContent as clearSavedPageContent, type ResettablePageId } from "@/lib/page-content-reset";
import { selectSharedTheme } from "@/lib/shared-theme-preferences";
import { mergeForegroundUsageIntoJournal, shouldApplySharedRoomSnapshot } from "@/lib/shared-journal-sync";
import { appendWeeklyCleaningTask } from "@/lib/weekly-cleaning";
import { normalizeAffectionGoals, updateAffectionGoal as updateAffectionGoalDefinition, type AffectionGoal, type AffectionGoalKey } from "@/lib/affection-goals";
import { splitForegroundSession } from "@/lib/app-usage";
import { AppState, type AppStateStatus } from "react-native";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const STATE_KEY = "together-daily-journal-v2";
const ROOM_KEY = "together-daily-room-v1";
export type PartnerId = "beans" | "princess";
const DEFAULT_PARTNER_NAMES: Record<PartnerId, string> = { beans: "Daddy", princess: "Princess" };
export const DEFAULT_PARTNER_COLORS: Record<PartnerId, string> = { beans: "#8D5BA6", princess: "#D56B88" };
const DEFAULT_PARTNER_SOFT_COLORS: Record<PartnerId, string> = { beans: "#261D31", princess: "#301B26" };
const DEFAULT_PARTNER_AVATARS: Record<PartnerId, string> = { beans: "🍆", princess: "🍑" };
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
export const PARTNERS: Record<PartnerId, { id: PartnerId; name: string; color: string; soft: string; avatar: string }> = {
  beans: { id: "beans", name: DEFAULT_PARTNER_NAMES.beans, color: DEFAULT_PARTNER_COLORS.beans, soft: DEFAULT_PARTNER_SOFT_COLORS.beans, avatar: DEFAULT_PARTNER_AVATARS.beans },
  princess: { id: "princess", name: DEFAULT_PARTNER_NAMES.princess, color: DEFAULT_PARTNER_COLORS.princess, soft: DEFAULT_PARTNER_SOFT_COLORS.princess, avatar: DEFAULT_PARTNER_AVATARS.princess },
};
export function partnerLabel(partnerId: PartnerId) { return `${PARTNERS[partnerId].avatar} ${PARTNERS[partnerId].name}`; }

type RecordType = "chat" | "loveNote" | "intimacy" | "steamyChat" | "cumLog" | "habit" | "dateIdea";
type PartnerNotificationType = "daily-log" | "love-note" | "todo" | "private-update" | "steamy-update";
export type LocalRecord = { id: string; authorId: PartnerId; recordType: RecordType; content: Record<string, unknown>; createdAt: string; dailyDate?: string };
export type LocalMedia = { id: string; kind: "cover" | "photo" | "private" | "calendar"; url: string; fileName: string; mimeType: string; caption: string; captions?: Partial<Record<PartnerId, string>>; width?: number; height?: number; comments?: { id: string; authorId: PartnerId; text: string; createdAt: string }[]; commentViewedAt?: Partial<Record<PartnerId, string>>; createdAt: string; dailyDate: string; uploadedBy?: PartnerId };
export type SavedLogStyle = { id: string; label: string; emoji: string; color: string; createdBy: PartnerId };
export type SharedThemePreferences = { accentColor?: string; backgroundColor?: string; backgroundGradient?: string[]; fontColor?: string; borderColor?: string; fontId?: string; animatedGradient?: boolean; dailyGradientRotation?: boolean };
export type NamedColorTheme = { id: string; name: string; accentColor: string; backgroundColor: string; createdBy: PartnerId };
export type CleaningTemplate = { id: string; name: string; tasks: string[]; createdBy: PartnerId };
export type PurchaseCategory = "groceries" | "house" | "misc";
export type PurchaseItem = { id: string; text: string; category: PurchaseCategory; addedBy: PartnerId; purchased: boolean; purchasedBy?: PartnerId; purchasedOn?: string };
export type CalendarEntry = { id: string; date: string; text: string; createdBy: PartnerId; createdAt: string };
type JournalState = { days: Record<string, Record<string, any>>; records: LocalRecord[]; media: LocalMedia[]; savedLogStyles?: SavedLogStyle[]; customSubheadings?: Record<string, string>; theme?: Partial<Record<PartnerId, SharedThemePreferences>> | SharedThemePreferences; themesByPartner?: Partial<Record<PartnerId, SharedThemePreferences>>; pageStyles?: unknown; themeUpdatedAt?: number; partnerNames?: Partial<Record<PartnerId, string>>; partnerColors?: Partial<Record<PartnerId, string>>; partnerAvatars?: Partial<Record<PartnerId, string>>; affectionGoals?: AffectionGoal[]; namedColorThemes?: NamedColorTheme[]; cleaningTemplates?: CleaningTemplate[]; purchaseItems?: PurchaseItem[]; calendarEntries?: CalendarEntry[]; calendarBackground?: LocalMedia; tabLabels?: Record<string, string>; tabGlyphs?: Record<string, string>; tabOrder?: string[]; customHeaders?: Record<string, string>; healthPeriodVisible?: boolean };
type RoomPrefs = { roomCode: string | null; memberId: PartnerId | null };

function normalizeJournalState(value: unknown): JournalState {
  const candidate = value && typeof value === "object" ? value as Partial<JournalState> : {};
  return {
    ...candidate,
    days: candidate.days && typeof candidate.days === "object" ? candidate.days : {},
    records: Array.isArray(candidate.records) ? candidate.records : [],
    media: Array.isArray(candidate.media) ? candidate.media : [],
  } as JournalState;
}

const QUESTIONS = ["What was a small moment today where you felt deeply loved or appreciated?", "What habit or quality in me has positively influenced your own life recently?", "How can I support you or lighten your mental load over the next 48 hours?", "What is your favorite quiet, unscripted memory of us from this past year?", "Describe our dream Sunday morning five years from now in three vivid sentences.", "What new experience would you love for us to try together before the year ends?", "What did you honestly think in the first ten minutes after we first met?"];
function updateCoverCaptions(day: Record<string, any>, mediaId: string, partnerId: PartnerId, value: string): Record<string, any> {
  const next = { ...day };
  const update = (cover: any) => {
    if (!cover || typeof cover !== "object" || cover.id !== mediaId) return cover;
    return { ...cover, captions: { ...(cover.captions ?? {}), [partnerId]: value } };
  };
  if (Array.isArray(next.coverPhotos)) next.coverPhotos = next.coverPhotos.map(update);
  if (next.coverPhoto && typeof next.coverPhoto === "object") next.coverPhoto = update(next.coverPhoto);
  if (next.coverPhotoTwo && typeof next.coverPhotoTwo === "object") next.coverPhotoTwo = update(next.coverPhotoTwo);
  return next;
}
function blankDay(date: string): Record<string, any> { const [year, month, day] = date.split("-").map(Number); const i = Math.abs(Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)) % QUESTIONS.length; return { date, title:"Daily Check-in", rating:null, weather:null, tags:[], pinned:false, coverPhoto:null, sharedHighlight:"", questionId:`daily-${i+1}`, questionText:QUESTIONS[i], todos:[], ...freshDailyFoodState(), water:{slots:[],glassesLogged:0,dailyGoalGlasses:8,resetDate:date,contributions:{beans:0,princess:0}}, notesList:[],timelineEvents:[],checkIns:{},photos:[],sharedNotes:"" }; }

export function filterSteamyDailyContent(records: LocalRecord[], media: LocalMedia[], date: string) {
  const filteredRecords = records.filter((record) => {
    if (record.recordType !== "steamyChat" && record.recordType !== "chat") return true;
    const recordDate = typeof record.dailyDate === "string" ? record.dailyDate : localDateKey(new Date(record.createdAt));
    return recordDate === date;
  });
  const filteredMedia = media.filter((item) => item.kind !== "private" || item.dailyDate === date);
  return { records: filteredRecords, media: filteredMedia };
}

type PartnerAlertStatus = { currentPhoneReady:boolean; partnerPhoneReady:boolean; partnerId:PartnerId };
type PartnerAlertTestResult = { recipientCount:number; acceptedCount:number; invalidTokens:string[]; message:string };
type JournalContextValue = { ready:boolean; today:string; roomCode:string|null; memberId:PartnerId|null; roomMembers:PartnerId[]; partner:typeof PARTNERS[PartnerId]|null; partnerNames:Record<PartnerId,string>; setPartnerName:(partnerId:PartnerId,name:string)=>void; partnerColors:Record<PartnerId,string>; setPartnerColor:(partnerId:PartnerId,color:string)=>void; partnerAvatars:Record<PartnerId,string>; setPartnerProfiles:(profiles:{names:Record<PartnerId,string>;colors:Record<PartnerId,string>;avatars:Record<PartnerId,string>})=>void; affectionGoals:AffectionGoal[]; updateAffectionGoal:(key:AffectionGoalKey,patch:Pick<AffectionGoal,"emoji"|"label">)=>void; isSyncing:boolean; syncError:string|null; partnerAlertStatus:PartnerAlertStatus|null; getDay:(date:string)=>Record<string,any>; ensureDay:(date:string)=>void; updateDay:(date:string,patch:Record<string,unknown>,notificationType?:PartnerNotificationType)=>void; addWeeklyCleaningTask:(weekStart:string,text:string)=>Promise<void>; clearPageContent:(pageId:ResettablePageId,date:string,weekStart:string)=>void; allDays:Record<string,any>[]; records:LocalRecord[]; addRecord:(recordType:RecordType,content:Record<string,unknown>)=>void; media:LocalMedia[]; addMedia:(media:Omit<LocalMedia,"id"|"createdAt"|"uploadedBy">)=>LocalMedia; uploadDailyCover:(media:{dailyDate:string;slot:"first"|"second";fileName:string;mimeType:"image/jpeg"|"image/png"|"image/webp"|"image/gif";base64:string;caption:string})=>Promise<LocalMedia>; uploadDailyCoverDirect:(media:{dailyDate:string;slot:"first"|"second";fileName:string;mimeType:"image/jpeg"|"image/png"|"image/webp"|"image/gif";uri:string;byteSize:number;caption:string})=>Promise<LocalMedia>; uploadDailyCoverCarouselDirect:(media:{dailyDate:string;fileName:string;mimeType:"image/jpeg"|"image/png"|"image/webp"|"image/gif";uri:string;byteSize:number})=>Promise<LocalMedia>; deleteDailyCover:(input:{dailyDate:string;slot:"first"|"second"})=>Promise<void>; deleteDailyCoverCarouselItem:(input:{dailyDate:string;mediaId:string})=>Promise<void>; uploadDailyLogMediaDirect:(media:{dailyDate:string;fileName:string;mimeType:"image/jpeg"|"image/png"|"image/webp"|"image/gif";uri:string;byteSize:number;width?:number;height?:number})=>Promise<LocalMedia>; deleteDailyLogMedia:(id:string)=>Promise<void>; uploadPrivateMedia:(media:{dailyDate:string;fileName:string;mimeType:"image/jpeg"|"image/png"|"image/webp"|"image/gif";base64:string;caption:string;width?:number;height?:number})=>Promise<LocalMedia>; uploadPrivateMediaDirect:(media:{dailyDate:string;fileName:string;mimeType:"image/jpeg"|"image/png"|"image/webp"|"image/gif";uri:string;byteSize:number;caption:string;width?:number;height?:number})=>Promise<LocalMedia>; deletePrivateMedia:(id:string)=>Promise<void>; uploadCalendarBackground:(media:{fileName:string;mimeType:"image/jpeg"|"image/png"|"image/webp"|"image/gif";base64:string;width?:number;height?:number})=>Promise<LocalMedia>; deleteCalendarBackground:()=>Promise<void>; calendarBackground:LocalMedia|null; updatePrivateMediaCaption:(id:string,caption:string)=>Promise<void>; updateDailyCoverCaption:(input:{dailyDate:string;mediaId:string;caption:string})=>Promise<void>; addPrivateMediaComment:(id:string,text:string)=>Promise<void>; deletePrivateMediaComment:(mediaId:string,commentId:string)=>Promise<void>; markPrivateMediaCommentsViewed:(mediaId:string)=>Promise<void>; savedLogStyles:SavedLogStyle[]; saveLogStyle:(style:Omit<SavedLogStyle,"id"|"createdBy">)=>SavedLogStyle; updateLogStyleColor:(id:string,color:string)=>void; deleteLogStyle:(id:string)=>void; addDailyLogEvent:(date:string,event:{id:string;text:string;authorId:PartnerId;createdAt:string},style:Omit<SavedLogStyle,"id"|"createdBy">)=>SavedLogStyle; updateDailyLogEvent:(date:string,id:string,patch:{text:string;type:string;emoji:string;color:string;createdAt:string})=>void; deleteDailyLogEvent:(date:string,id:string)=>void; customSubheadings:Record<string,string>; setCustomSubheading:(key:string,value:string)=>void; theme:SharedThemePreferences; setTheme:(patch:SharedThemePreferences)=>void; namedColorThemes:NamedColorTheme[]; saveNamedColorTheme:(theme:Omit<NamedColorTheme,"id"|"createdBy">)=>void; renameNamedColorTheme:(id:string,name:string)=>void; deleteNamedColorTheme:(id:string)=>void; cleaningTemplates:CleaningTemplate[]; saveCleaningTemplate:(template:Omit<CleaningTemplate,"id"|"createdBy">)=>void; updateCleaningTemplate:(id:string,template:Pick<CleaningTemplate,"name"|"tasks">)=>void; deleteCleaningTemplate:(id:string)=>void; purchaseItems:PurchaseItem[]; addPurchaseItem:(category:PurchaseCategory,text:string)=>void; togglePurchaseItem:(id:string)=>void; deletePurchaseItem:(id:string)=>void; calendarEntries:CalendarEntry[]; addCalendarEntry:(date:string,text:string)=>void; updateCalendarEntry:(id:string,text:string)=>void; deleteCalendarEntry:(id:string)=>void; tabLabels:Record<string,string>; setTabLabel:(key:string,label:string)=>void; tabGlyphs:Record<string,string>; setTabGlyph:(key:string,glyph:string)=>void; setTabCustomizations:(input:{labels:Record<string,string>;glyphs:Record<string,string>;order:string[]})=>void; tabOrder:string[]; setTabOrder:(order:string[])=>void; healthPeriodVisible:boolean; setHealthPeriodVisible:(visible:boolean)=>void; resetPersonalization:()=>void; createRoom:(partnerId:PartnerId)=>Promise<void>; joinRoom:(roomCode:string,partnerId:PartnerId)=>Promise<void>; registerPushToken:(token:string,platform:"android"|"ios")=>Promise<void>; sendTestPartnerAlert:()=>Promise<PartnerAlertTestResult>; };
const JournalContext = createContext<JournalContextValue | null>(null);

function normalizedRoomMembers(value: unknown): PartnerId[] {
  return Array.isArray(value) ? value.filter((member): member is PartnerId => member === "beans" || member === "princess") : [];
}

export function createDayWithCarriedHealthTasks(days: Record<string, Record<string, any>>, date: string): Record<string, any> {
  const carriedTasks = carryDailyHealthTasks(days, date);
  const carriedHabits = carryDailyHabitList(days, date);
  return {
    ...blankDay(date),
    ...(carriedTasks.length ? { health: { snacks: [], tasks: carriedTasks } } : {}),
    ...(carriedHabits.length ? { habits: { list: carriedHabits, checks: {} } } : {}),
  };
}

function currentSharedTheme(state: JournalState): SharedThemePreferences {
  return selectSharedTheme(state.theme, state.themesByPartner);
}

function withSharedTheme(state: JournalState, theme: SharedThemePreferences): JournalState {
  return { ...state, theme, themesByPartner: undefined, pageStyles: undefined, themeUpdatedAt: Date.now() };
}

export function LocalJournalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JournalState>({ days:{}, records:[], media:[] }); const [prefs, setPrefs] = useState<RoomPrefs>({ roomCode:null, memberId:null }); const [roomMembers, setRoomMembers] = useState<PartnerId[]>([]); const [ready, setReady] = useState(false); const [syncError, setSyncError] = useState<string|null>(null); const [today, setToday] = useState(() => localDateKey()); const pendingSharedState = useRef<string | null>(null); const stateRef = useRef(state); const prefsRef = useRef(prefs); const localWriteAtRef = useRef(0); const syncInFlightRef = useRef(false); const queuedSharedStateRef = useRef<{ state: JournalState; serialized: string; notificationType?: PartnerNotificationType } | null>(null);
  stateRef.current = state; prefsRef.current = prefs;
  const create = trpc.guestRoom.create.useMutation(); const join = trpc.guestRoom.join.useMutation(); const sync = trpc.guestRoom.update.useMutation(); const weeklyCleaningTaskAdd = trpc.guestRoom.addWeeklyCleaningTask.useMutation(); const appUsageRecord = trpc.guestRoom.recordAppUsage.useMutation(); const registerPush = trpc.guestRoom.registerPushToken.useMutation(); const dailyCoverUpload = trpc.guestRoom.uploadDailyCover.useMutation(); const dailyCoverDirectRequest = trpc.guestRoom.requestDailyCoverDirectUpload.useMutation(); const dailyCoverDirectConfirm = trpc.guestRoom.confirmDailyCoverDirectUpload.useMutation(); const dailyCoverCarouselDirectRequest = trpc.guestRoom.requestDailyCoverCarouselDirectUpload.useMutation(); const dailyCoverCarouselDirectConfirm = trpc.guestRoom.confirmDailyCoverCarouselDirectUpload.useMutation(); const dailyCoverDelete = trpc.guestRoom.deleteDailyCover.useMutation(); const dailyCoverCarouselDelete = trpc.guestRoom.deleteDailyCoverCarouselItem.useMutation(); const dailyCoverCaptionUpdate = trpc.guestRoom.updateDailyCoverCaption.useMutation(); const dailyLogMediaDirectRequest = trpc.guestRoom.requestDailyLogMediaDirectUpload.useMutation(); const dailyLogMediaDirectConfirm = trpc.guestRoom.confirmDailyLogMediaDirectUpload.useMutation(); const dailyLogMediaDelete = trpc.guestRoom.deleteDailyLogMedia.useMutation(); const privateMediaUpload = trpc.guestRoom.uploadPrivateMedia.useMutation(); const privateMediaDirectRequest = trpc.guestRoom.requestPrivateMediaDirectUpload.useMutation(); const privateMediaDirectConfirm = trpc.guestRoom.confirmPrivateMediaDirectUpload.useMutation(); const privateMediaDelete = trpc.guestRoom.deletePrivateMedia.useMutation(); const privateMediaCaptionUpdate = trpc.guestRoom.updatePrivateMediaCaption.useMutation(); const privateMediaCommentCreate = trpc.guestRoom.addPrivateMediaComment.useMutation(); const privateMediaCommentDelete = trpc.guestRoom.deletePrivateMediaComment.useMutation(); const privateMediaCommentViewed = trpc.guestRoom.markPrivateMediaCommentsViewed.useMutation(); const calendarBackgroundUpload = trpc.guestRoom.uploadCalendarBackground.useMutation(); const calendarBackgroundDelete = trpc.guestRoom.deleteCalendarBackground.useMutation();
  const syncMutationRef = useRef<(input: { roomCode: string; journalState: JournalState; actorId?: string; notificationType?: string }) => Promise<void>>(async (input) => {
    if (isSupabaseConfigured) {
      await sbUpdateRoom(input.roomCode, input.journalState);
      return;
    }
    await sync.mutateAsync({ roomCode: input.roomCode, journalState: input.journalState, actorId: input.actorId as any, notificationType: input.notificationType as any });
  });
  syncMutationRef.current = syncMutationRef.current;
  const appUsageRecordRef = useRef(appUsageRecord.mutateAsync);
  appUsageRecordRef.current = appUsageRecord.mutateAsync;
  // Supabase polling for remote room state (replaces trpc.guestRoom.get.useQuery)
  const [remoteData, setRemoteData] = useState<{ journalState: JournalState; memberIds: string[] } | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured || !ready || !prefs.roomCode) return;
    let active = true;
    const poll = async () => {
      try {
        const room = await sbGetRoom(prefs.roomCode!);
        if (active && room) setRemoteData(room);
      } catch (err) {
        console.error("[Supabase poll] failed:", err);
      }
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => { active = false; clearInterval(interval); };
  }, [ready, prefs.roomCode]);
  const remote = isSupabaseConfigured
    ? { data: remoteData ? { journalState: remoteData.journalState, memberIds: remoteData.memberIds } : undefined, isFetching: false, refetch: () => {} }
    : trpc.guestRoom.get.useQuery({ roomCode: prefs.roomCode ?? "" }, { enabled: ready && Boolean(prefs.roomCode), refetchInterval: 3_000, retry: 1 });
  const partnerAlertReadiness = trpc.guestRoom.getPushStatus.useQuery({ roomCode:prefs.roomCode ?? "", partnerId:prefs.memberId ?? "beans" }, { enabled: ready && Boolean(prefs.roomCode) && Boolean(prefs.memberId), refetchInterval:8_000, retry:1 });
  const testPartnerAlert = trpc.guestRoom.sendTestPartnerAlert.useMutation();
  const saveLocalState = (next: JournalState) => { stateRef.current = next; setState(next); AsyncStorage.setItem(STATE_KEY, JSON.stringify(next)).catch(() => undefined); };
  const flushSharedState = () => {
    if (syncInFlightRef.current || !queuedSharedStateRef.current) return;
    const roomCode = prefsRef.current.roomCode;
    if (!roomCode) return;
    const queued = queuedSharedStateRef.current;
    syncInFlightRef.current = true;
    void syncMutationRef.current({ roomCode, journalState: queued.state, actorId: prefsRef.current.memberId ?? undefined, notificationType: queued.notificationType })
      .then(() => {
        if (queuedSharedStateRef.current?.serialized === queued.serialized) {
          queuedSharedStateRef.current = null;
          if (pendingSharedState.current === queued.serialized) pendingSharedState.current = null;
        }
      })
      .catch((error: Error) => {
        if (queuedSharedStateRef.current?.serialized === queued.serialized) {
          queuedSharedStateRef.current = null;
          if (pendingSharedState.current === queued.serialized) pendingSharedState.current = null;
        }
        setSyncError(error.message);
      })
      .finally(() => { syncInFlightRef.current = false; flushSharedState(); });
  };
  useEffect(()=>{Promise.all([AsyncStorage.getItem(STATE_KEY),AsyncStorage.getItem(ROOM_KEY)]).then(([storedState,storedPrefs])=>{if(storedState){try{setState(normalizeJournalState(JSON.parse(storedState)))}catch{}} if(storedPrefs){try{const parsed=JSON.parse(storedPrefs);setPrefs({roomCode:typeof parsed.roomCode==="string"?parsed.roomCode:null,memberId:parsed.memberId==="beans"||parsed.memberId==="princess"?parsed.memberId:null})}catch{}}}).finally(()=>setReady(true));},[]);
  useEffect(()=>{if(!remote.data) return; const next=normalizeJournalState(remote.data.journalState); const current=JSON.stringify(stateRef.current); const incoming=JSON.stringify(next); if(pendingSharedState.current===incoming) pendingSharedState.current=null; const hasPending=Boolean(pendingSharedState.current)||syncInFlightRef.current||Boolean(queuedSharedStateRef.current); const shouldApply=isSupabaseConfigured ? (current !== incoming && !hasPending) : shouldApplySharedRoomSnapshot({localSerialized:current,incomingSerialized:incoming,hasPendingLocalWrite:hasPending,lastLocalWriteAt:localWriteAtRef.current}); if(shouldApply)saveLocalState(next); const nextMembers=normalizedRoomMembers(remote.data.memberIds);setRoomMembers(currentMembers=>currentMembers.length===nextMembers.length&&currentMembers.every(member=>nextMembers.includes(member))?currentMembers:nextMembers);},[remote.data]);
  const savePrefs=(next:RoomPrefs)=>{setPrefs(next); AsyncStorage.setItem(ROOM_KEY,JSON.stringify(next)).catch(()=>undefined);};
  const persist=(next:JournalState,notificationType?:PartnerNotificationType)=>{saveLocalState(next); const serialized=JSON.stringify(next); localWriteAtRef.current=Date.now(); if(prefs.roomCode){pendingSharedState.current=serialized; queuedSharedStateRef.current={state:next,serialized,notificationType}; flushSharedState();}};
  const ensureRoomMembership=async()=>{if(!prefs.roomCode||!prefs.memberId||roomMembers.includes(prefs.memberId))return;if(isSupabaseConfigured){const result=await sbJoinRoom(prefs.roomCode,prefs.memberId);setRoomMembers(normalizedRoomMembers(result.memberIds));return;}const result=await join.mutateAsync({roomCode:prefs.roomCode,memberId:prefs.memberId});setRoomMembers(normalizedRoomMembers(result.memberIds));};
  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout> | undefined;
    const refreshToday = () => setToday((current) => {
      const next = localDateKey();
      return next === current ? current : next;
    });
    const scheduleNextMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 1, 0);
      midnightTimer = setTimeout(() => {
        refreshToday();
        scheduleNextMidnight();
      }, Math.max(1_000, nextMidnight.getTime() - Date.now()));
    };
    scheduleNextMidnight();
    const lifecycle = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") refreshToday();
    });
    return () => {
      if (midnightTimer) clearTimeout(midnightTimer);
      lifecycle.remove();
    };
  }, []);
  useEffect(() => {
    const roomCode = prefs.roomCode;
    const partnerId = prefs.memberId;
    if (!ready || !roomCode || !partnerId || !roomMembers.includes(partnerId)) return;

    let activeSince = AppState.currentState === "active" ? Date.now() : null;
    let disposed = false;
    let flushing = false;
    const flushForegroundTime = async () => {
      const startedAt = activeSince;
      if (!startedAt || disposed || flushing) return;
      flushing = true;
      const endedAt = Date.now();
      activeSince = endedAt;
      const entries = splitForegroundSession(startedAt, endedAt);
      if (!entries.length) { flushing = false; return; }

      try {
        const result = await appUsageRecordRef.current({ roomCode, partnerId, entries });
        if (disposed) return;
        const next = mergeForegroundUsageIntoJournal(stateRef.current, normalizeJournalState(result.journalState));
        saveLocalState(next);
      } catch {
        // Keep the next active checkpoint available without creating a render loop.
      } finally {
        flushing = false;
      }
    };

    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") {
        activeSince = Date.now();
        return;
      }
      void flushForegroundTime();
      activeSince = null;
    });
    const checkpoint = setInterval(() => { void flushForegroundTime(); }, 15_000);

    return () => {
      void flushForegroundTime();
      disposed = true;
      subscription.remove();
      clearInterval(checkpoint);
    };
  }, [prefs.memberId, prefs.roomCode, ready, roomMembers]);
  useEffect(()=>{if(!ready)return;const items=state.purchaseItems??[];const datedItems=items.map((item)=>item.category==="groceries"&&item.purchased&&!item.purchasedOn?{...item,purchasedOn:today}:item);const remaining=clearPurchasedGroceriesFromPreviousDays(datedItems,today);if(JSON.stringify(remaining)===JSON.stringify(items))return;persist({...state,purchaseItems:remaining});},[ready,state,today]);
  const ensureDay=(date:string)=>{if(!state.days[date])persist({...state,days:{...state.days,[date]:createDayWithCarriedHealthTasks(state.days,date)}});};
  const partnerNames: Record<PartnerId, string> = { beans: state.partnerNames?.beans?.trim() || DEFAULT_PARTNER_NAMES.beans, princess: state.partnerNames?.princess?.trim() || DEFAULT_PARTNER_NAMES.princess };
  const partnerColors: Record<PartnerId, string> = { beans: HEX_COLOR.test(state.partnerColors?.beans ?? "") ? state.partnerColors!.beans! : DEFAULT_PARTNER_COLORS.beans, princess: HEX_COLOR.test(state.partnerColors?.princess ?? "") ? state.partnerColors!.princess! : DEFAULT_PARTNER_COLORS.princess };
  const partnerAvatars: Record<PartnerId, string> = { beans: state.partnerAvatars?.beans?.trim() || DEFAULT_PARTNER_AVATARS.beans, princess: state.partnerAvatars?.princess?.trim() || DEFAULT_PARTNER_AVATARS.princess };
  PARTNERS.beans.name = partnerNames.beans; PARTNERS.princess.name = partnerNames.princess; PARTNERS.beans.color = partnerColors.beans; PARTNERS.princess.color = partnerColors.princess; PARTNERS.beans.avatar = partnerAvatars.beans; PARTNERS.princess.avatar = partnerAvatars.princess; PARTNERS.beans.soft = partnerColors.beans === DEFAULT_PARTNER_COLORS.beans ? DEFAULT_PARTNER_SOFT_COLORS.beans : `${partnerColors.beans}26`; PARTNERS.princess.soft = partnerColors.princess === DEFAULT_PARTNER_COLORS.princess ? DEFAULT_PARTNER_SOFT_COLORS.princess : `${partnerColors.princess}26`;
  const activeTheme = currentSharedTheme(state);
  const affectionGoals = normalizeAffectionGoals(state.affectionGoals);
  const value=useMemo<JournalContextValue>(()=>({
    ready, today, roomCode:prefs.roomCode, memberId:prefs.memberId, roomMembers, partner:prefs.memberId?PARTNERS[prefs.memberId]:null, partnerNames, setPartnerName:(partnerId,name)=>{const trimmed=name.trim();if(!trimmed||trimmed.length>24)return;persist({...state,partnerNames:{...(state.partnerNames??{}),[partnerId]:trimmed}});}, partnerColors, setPartnerColor:(partnerId,color)=>{const normalized=color.trim().toUpperCase();if(!HEX_COLOR.test(normalized))return;persist({...state,partnerColors:{...(state.partnerColors??{}),[partnerId]:normalized}});}, partnerAvatars, setPartnerProfiles:({names,colors,avatars})=>{const nextNames: Partial<Record<PartnerId,string>>={};const nextColors: Partial<Record<PartnerId,string>>={};const nextAvatars: Partial<Record<PartnerId,string>>={};(["beans","princess"] as PartnerId[]).forEach((partnerId)=>{const name=names[partnerId].trim();const color=colors[partnerId].trim().toUpperCase();const avatar=avatars[partnerId].trim();if(name&&name.length<=24)nextNames[partnerId]=name;if(HEX_COLOR.test(color))nextColors[partnerId]=color;if(avatar&&avatar.length<=12)nextAvatars[partnerId]=avatar;});persist({...state,partnerNames:{...(state.partnerNames??{}),...nextNames},partnerColors:{...(state.partnerColors??{}),...nextColors},partnerAvatars:{...(state.partnerAvatars??{}),...nextAvatars}});}, affectionGoals, updateAffectionGoal:(key,patch)=>{const next=updateAffectionGoalDefinition(affectionGoals,key,patch);persist({...state,affectionGoals:next});}, isSyncing:sync.isPending||remote.isFetching, syncError, partnerAlertStatus:partnerAlertReadiness.data??null,
    getDay:(date)=>state.days[date]??blankDay(date), ensureDay, updateDay:(date,patch,notificationType)=>{const current=state.days[date]??blankDay(date);persist({...state,days:{...state.days,[date]:{...current,...patch,date}}},notificationType);}, addWeeklyCleaningTask:async(weekStart,text)=>{const value=text.trim();if(!value)return;const task={id:`clean-${Date.now()}-${Math.random().toString(16).slice(2)}`,text:value,createdBy:prefs.memberId??"beans",completed:false};if(!prefs.roomCode||!prefs.memberId){const current=state.days[weekStart]??blankDay(weekStart);const cleaning=current.cleaning&&typeof current.cleaning==="object"?current.cleaning:{};persist({...state,days:{...state.days,[weekStart]:{...current,date:weekStart,cleaning:{...cleaning,tasks:appendWeeklyCleaningTask(cleaning.tasks,task),weekStart}}}});return;}const result=await weeklyCleaningTaskAdd.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,weekStart,text:value});const next=result.journalState as JournalState;setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);void remote.refetch();}, clearPageContent:(pageId,date,weekStart)=>{persist(clearSavedPageContent(state,pageId,date,weekStart,blankDay) as JournalState);}, allDays:Object.values(state.days).sort((a,b)=>String(b.date).localeCompare(String(a.date))), records:state.records,
    addRecord:(recordType,content)=>{const authorId=prefs.memberId??"beans";const today = localDateKey(); const record:LocalRecord={id:`record-${Date.now()}-${Math.random().toString(16).slice(2)}`,authorId,recordType,content,createdAt:new Date().toISOString(),dailyDate: today};persist({...state,records:[...state.records,record]},recordType==="cumLog"||recordType==="steamyChat"?"steamy-update":"private-update");}, media:state.media,
    addMedia:(input)=>{const media:LocalMedia={...input,id:`media-${Date.now()}-${Math.random().toString(16).slice(2)}`,createdAt:new Date().toISOString(),uploadedBy:prefs.memberId??"beans"};persist({...state,media:[media,...state.media]});return media;}, uploadCalendarBackground:async(input)=>{const fallback=()=>{const background:LocalMedia={id:`calendar-background-${Date.now()}-${Math.random().toString(16).slice(2)}`,kind:"calendar",url:`data:${input.mimeType};base64,${input.base64}`,fileName:input.fileName,mimeType:input.mimeType,caption:"",width:input.width,height:input.height,createdAt:new Date().toISOString(),dailyDate:"calendar",uploadedBy:prefs.memberId??"beans"};persist({...state,calendarBackground:background});return background;};if(!prefs.roomCode||!prefs.memberId)return fallback();await ensureRoomMembership();const result=await calendarBackgroundUpload.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,fileName:input.fileName,mimeType:input.mimeType,base64:input.base64,width:input.width,height:input.height});const next=result.journalState as JournalState;const background=result.background as LocalMedia;if(!background?.id||next.calendarBackground?.id!==background.id)throw new Error("The shared room did not confirm this Calendar background. Please try again.");setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);void remote.refetch();return background;}, deleteCalendarBackground:async()=>{if(!prefs.roomCode||!prefs.memberId){persist({...state,calendarBackground:undefined});return;}const result=await calendarBackgroundDelete.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId});const next=result.journalState as JournalState;setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);void remote.refetch();}, calendarBackground:state.calendarBackground??null, uploadDailyCover:async(input)=>{const fallback=()=>{const media:LocalMedia={id:`media-${Date.now()}-${Math.random().toString(16).slice(2)}`,kind:"cover",url:`data:${input.mimeType};base64,${input.base64}`,fileName:input.fileName,mimeType:input.mimeType,caption:input.caption,captions:{beans:prefs.memberId==="beans"?input.caption:"",princess:prefs.memberId==="princess"?input.caption:""},createdAt:new Date().toISOString(),dailyDate:input.dailyDate,uploadedBy:prefs.memberId??"beans"};const current=state.days[input.dailyDate]??blankDay(input.dailyDate);const coverKey=input.slot==="first"?"coverPhoto":"coverPhotoTwo";persist({...state,media:[media,...state.media],days:{...state.days,[input.dailyDate]:{...current,date:input.dailyDate,[coverKey]:media}}});return media;};if(!prefs.roomCode||!prefs.memberId)return fallback();await ensureRoomMembership();const result=await dailyCoverUpload.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,dailyDate:input.dailyDate,slot:input.slot,fileName:input.fileName,mimeType:input.mimeType,base64:input.base64,caption:input.caption});const next=result.journalState as JournalState;const saved=result.media as LocalMedia;if(!saved?.id||!next.media.some((item)=>item.id===saved.id))throw new Error("The shared room did not confirm this cover photo. Please try again.");setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);void remote.refetch();return saved;}, uploadDailyCoverDirect:async(input)=>{if(!prefs.roomCode||!prefs.memberId)throw new Error("Join your shared room before uploading a cover photo or GIF.");await ensureRoomMembership();const reserved=await dailyCoverDirectRequest.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,dailyDate:input.dailyDate,slot:input.slot,fileName:input.fileName,mimeType:input.mimeType,byteSize:input.byteSize});await uploadPickedImageDirect({uri:input.uri,uploadUrl:reserved.uploadUrl,mimeType:input.mimeType});const result=await dailyCoverDirectConfirm.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,dailyDate:input.dailyDate,slot:input.slot,fileName:input.fileName,mimeType:input.mimeType,storageKey:reserved.key,caption:input.caption});const next=result.journalState as JournalState;const saved=result.media as LocalMedia;if(!saved?.id||next.days?.[input.dailyDate]?.[input.slot==="first"?"coverPhoto":"coverPhotoTwo"]?.id!==saved.id)throw new Error("The shared room did not confirm this cover photo. Please try again.");setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);void remote.refetch();return saved;}, deleteDailyCover:async(input)=>{const coverKey=input.slot==="first"?"coverPhoto":"coverPhotoTwo";if(!prefs.roomCode||!prefs.memberId){const current=state.days[input.dailyDate]??blankDay(input.dailyDate);const { [coverKey]: _removedCover, ...remainingDay }=current;const coverId=current[coverKey]?.id;persist({...state,days:{...state.days,[input.dailyDate]:{...remainingDay,date:input.dailyDate}},media:state.media.filter((item)=>item.id!==coverId)});return;}const result=await dailyCoverDelete.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,dailyDate:input.dailyDate,slot:input.slot});const next=result.journalState as JournalState;setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);}, uploadDailyCoverCarouselDirect:async(input)=>{if(isSupabaseConfigured){if(!prefs.roomCode||!prefs.memberId)throw new Error("Join your shared room before uploading a cover photo or GIF.");const url=await uploadToSupabaseStorage(input.uri,`guest-rooms/${prefs.roomCode}/covers/${input.dailyDate}/${Date.now()}-${input.fileName}`,input.mimeType);const media:LocalMedia={id:`media-${Date.now()}-${Math.random().toString(16).slice(2)}`,kind:"cover",url,fileName:input.fileName,mimeType:input.mimeType,caption:"",createdAt:new Date().toISOString(),dailyDate:input.dailyDate,uploadedBy:prefs.memberId??"beans"};const current=state.days[input.dailyDate]??blankDay(input.dailyDate);const coverPhotos=Array.isArray(current.coverPhotos)?[...current.coverPhotos,media]:[media];persist({...state,media:[media,...state.media],days:{...state.days,[input.dailyDate]:{...current,date:input.dailyDate,coverPhotos}}});return media;}if(!prefs.roomCode||!prefs.memberId)throw new Error("Join your shared room before uploading a cover photo or GIF.");await ensureRoomMembership();const reserved=await dailyCoverCarouselDirectRequest.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,dailyDate:input.dailyDate,fileName:input.fileName,mimeType:input.mimeType,byteSize:input.byteSize});await uploadPickedImageDirect({uri:input.uri,uploadUrl:reserved.uploadUrl,mimeType:input.mimeType});const result=await dailyCoverCarouselDirectConfirm.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,dailyDate:input.dailyDate,fileName:input.fileName,mimeType:input.mimeType,storageKey:reserved.key});const next=result.journalState as JournalState;const saved=result.media as LocalMedia;if(!saved?.id||!Array.isArray(next.days?.[input.dailyDate]?.coverPhotos)||!next.days[input.dailyDate].coverPhotos.some((item:any)=>item?.id===saved.id))throw new Error("The shared room did not confirm this cover photo. Please try again.");setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);void remote.refetch();return saved;}, deleteDailyCoverCarouselItem:async(input)=>{const target=state.media.find((item)=>item.id===input.mediaId);if(isSupabaseConfigured){if(target?.url) await deleteFromSupabaseStorage(target.url);const current=state.days[input.dailyDate]??blankDay(input.dailyDate);const coverPhotos=Array.isArray(current.coverPhotos)?current.coverPhotos.filter((item:any)=>item?.id!==input.mediaId):[];persist({...state,media:state.media.filter((item)=>item.id!==input.mediaId),days:{...state.days,[input.dailyDate]:{...current,date:input.dailyDate,coverPhotos}}});return;}if(!prefs.roomCode||!prefs.memberId)throw new Error("Join your shared room before removing a cover photo.");const result=await dailyCoverCarouselDelete.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,dailyDate:input.dailyDate,mediaId:input.mediaId});const next=result.journalState as JournalState;setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);void remote.refetch();}, updateDailyCoverCaption:async(input)=>{const value=input.caption.trim();const memberId=(prefs.memberId??"beans") as PartnerId;if(!prefs.roomCode||!prefs.memberId){persist({...state,days:{...state.days,[input.dailyDate]:updateCoverCaptions(state.days[input.dailyDate]??blankDay(input.dailyDate),input.mediaId,memberId,value)},media:state.media.map((item)=>item.id===input.mediaId&&item.kind==="cover"?{...item,captions:{...(item.captions??{}),[memberId]:value}}:item)});return;}await ensureRoomMembership();const result=await dailyCoverCaptionUpdate.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,dailyDate:input.dailyDate,mediaId:input.mediaId,caption:value});const next=result.journalState as JournalState;setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);void remote.refetch();}, uploadDailyLogMediaDirect:async(input)=>{if(isSupabaseConfigured){if(!prefs.roomCode||!prefs.memberId)throw new Error("Join your shared room before uploading a Daily Log photo or GIF.");const url=await uploadToSupabaseStorage(input.uri,`guest-rooms/${prefs.roomCode}/daily-log/${input.dailyDate}/${Date.now()}-${input.fileName}`,input.mimeType);const media:LocalMedia={id:`media-${Date.now()}-${Math.random().toString(16).slice(2)}`,kind:"photo",url,fileName:input.fileName,mimeType:input.mimeType,createdAt:new Date().toISOString(),dailyDate:input.dailyDate,uploadedBy:prefs.memberId??"beans",width:input.width,height:input.height};persist({...state,media:[media,...state.media]});return media;}if(!prefs.roomCode||!prefs.memberId)throw new Error("Join your shared room before uploading a Daily Log photo or GIF.");await ensureRoomMembership();const reserved=await dailyLogMediaDirectRequest.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,dailyDate:input.dailyDate,fileName:input.fileName,mimeType:input.mimeType,byteSize:input.byteSize});await uploadPickedImageDirect({uri:input.uri,uploadUrl:reserved.uploadUrl,mimeType:input.mimeType});const result=await dailyLogMediaDirectConfirm.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,dailyDate:input.dailyDate,fileName:input.fileName,mimeType:input.mimeType,storageKey:reserved.key,width:input.width,height:input.height});const next=result.journalState as JournalState;const saved=result.media as LocalMedia;if(!saved?.id||!next.media.some((item)=>item.id===saved.id))throw new Error("The shared room did not confirm this Daily Log media. Please try again.");setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);void remote.refetch();return saved;}, deleteDailyLogMedia:async(id)=>{if(!prefs.roomCode||!prefs.memberId)throw new Error("Join your shared room before removing Daily Log media.");const result=await dailyLogMediaDelete.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,mediaId:id});const next=result.journalState as JournalState;setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);void remote.refetch();}, uploadPrivateMedia:async(input)=>{const fallback=()=>{const media:LocalMedia={id:`media-${Date.now()}-${Math.random().toString(16).slice(2)}`,kind:"private",url:`data:${input.mimeType};base64,${input.base64}`,fileName:input.fileName,mimeType:input.mimeType,caption:input.caption,width:input.width,height:input.height,createdAt:new Date().toISOString(),dailyDate:input.dailyDate,uploadedBy:prefs.memberId??"beans"};persist({...state,media:[media,...state.media]});return media;};if(!prefs.roomCode||!prefs.memberId)return fallback();await ensureRoomMembership();const result=await privateMediaUpload.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,dailyDate:input.dailyDate,fileName:input.fileName,mimeType:input.mimeType,base64:input.base64,caption:input.caption,width:input.width,height:input.height});const next=result.journalState as JournalState;const saved=result.media as LocalMedia;if(!saved?.id||!next.media.some((item)=>item.id===saved.id))throw new Error("The shared room did not confirm this private upload. Please try again.");setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);void remote.refetch();return saved;}, uploadPrivateMediaDirect:async(input)=>{if(isSupabaseConfigured){if(!prefs.roomCode||!prefs.memberId)throw new Error("Join your shared room before uploading.");const url=await uploadToSupabaseStorage(input.uri,`guest-rooms/${prefs.roomCode}/private/${Date.now()}-${input.fileName}`,input.mimeType);const media:LocalMedia={id:`media-${Date.now()}-${Math.random().toString(16).slice(2)}`,kind:"private",url,fileName:input.fileName,mimeType:input.mimeType,caption:input.caption,width:input.width,height:input.height,createdAt:new Date().toISOString(),dailyDate:input.dailyDate,uploadedBy:prefs.memberId??"beans"};persist({...state,media:[media,...state.media]});return media;}if(!prefs.roomCode||!prefs.memberId)throw new Error("Join your shared room before uploading a large GIF.");await ensureRoomMembership();const reserved=await privateMediaDirectRequest.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,fileName:input.fileName,mimeType:input.mimeType,byteSize:input.byteSize});await uploadPickedImageDirect({uri:input.uri,uploadUrl:reserved.uploadUrl,mimeType:input.mimeType});const result=await privateMediaDirectConfirm.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,dailyDate:input.dailyDate,fileName:input.fileName,mimeType:input.mimeType,storageKey:reserved.key,caption:input.caption,width:input.width,height:input.height});const next=result.journalState as JournalState;const saved=result.media as LocalMedia;if(!saved?.id||!next.media.some((item)=>item.id===saved.id))throw new Error("The shared room did not confirm this private upload. Please try again.");setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);void remote.refetch();return saved;}, deletePrivateMedia:async(id)=>{const target=state.media.find((item)=>item.id===id);if(isSupabaseConfigured){if(target?.url) await deleteFromSupabaseStorage(target.url);persist({...state,media:state.media.filter((item)=>item.id!==id)});return;}if(!prefs.roomCode||!prefs.memberId){persist({...state,media:state.media.filter((item)=>item.id!==id)});return;}const result=await privateMediaDelete.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,mediaId:id});const next=result.journalState as JournalState;setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);}, updatePrivateMediaCaption:async(id,caption)=>{const value=caption.trim();if(!prefs.roomCode||!prefs.memberId){persist({...state,media:state.media.map((item)=>item.id===id?{...item,caption:value}:item)});return;}const result=await privateMediaCaptionUpdate.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,mediaId:id,caption:value});const next=result.journalState as JournalState;setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);}, addPrivateMediaComment:async(id,text)=>{const value=text.trim();if(!value)return;const comment={id:`media-comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,authorId:(prefs.memberId??"beans") as PartnerId,text:value,createdAt:new Date().toISOString()};if(!prefs.roomCode||!prefs.memberId){persist({...state,media:state.media.map((item)=>item.id===id?{...item,comments:[...(item.comments??[]),comment]}:item)});return;}const result=await privateMediaCommentCreate.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,mediaId:id,text:value});const next=result.journalState as JournalState;setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);}, deletePrivateMediaComment:async(mediaId,commentId)=>{if(!prefs.roomCode||!prefs.memberId){const target=state.media.find((item)=>item.id===mediaId);const comment=target?.comments?.find((item)=>item.id===commentId);if(!comment||comment.authorId!==prefs.memberId)throw new Error("Only the person who wrote a comment can delete it.");persist({...state,media:state.media.map((item)=>item.id===mediaId?{...item,comments:(item.comments??[]).filter((comment)=>comment.id!==commentId)}:item)});return;}const result=await privateMediaCommentDelete.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,mediaId,commentId});const next=result.journalState as JournalState;setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);},
    markPrivateMediaCommentsViewed:async(mediaId)=>{const viewedAt=new Date().toISOString();const viewer=(prefs.memberId??"beans") as PartnerId;if(!prefs.roomCode||!prefs.memberId){persist({...state,media:state.media.map((item)=>item.id===mediaId?{...item,commentViewedAt:{...(item.commentViewedAt??{}),[viewer]:viewedAt}}:item)});return;}const result=await privateMediaCommentViewed.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,mediaId});const next=result.journalState as JournalState;setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);},
    savedLogStyles:state.savedLogStyles??[],
    saveLogStyle:(style)=>{const existing=state.savedLogStyles??[];const duplicate=existing.find((item)=>item.label.trim().toLowerCase()===style.label.trim().toLowerCase()&&item.emoji===style.emoji&&item.color===style.color);if(duplicate)return duplicate;const saved:SavedLogStyle={...style,id:`log-style-${Date.now()}-${Math.random().toString(16).slice(2)}`,createdBy:prefs.memberId??"beans"};persist({...state,savedLogStyles:[...existing,saved]},"daily-log");return saved;},
    updateLogStyleColor:(id,color)=>{const updated=recolorSavedLogStyle(state.savedLogStyles??[],state.days,id,color);if(!updated.changed)return;persist({...state,savedLogStyles:updated.styles,days:updated.days},"daily-log");},
    deleteLogStyle:(id)=>{const existing=state.savedLogStyles??[];persist({...state,savedLogStyles:existing.filter((style)=>style.id!==id)},"daily-log");},
    addDailyLogEvent:(date,event,style)=>{const existing=state.savedLogStyles??[];const duplicate=existing.find((item)=>item.label.trim().toLowerCase()===style.label.trim().toLowerCase()&&item.emoji===style.emoji&&item.color===style.color);const saved=duplicate??{...style,id:`log-style-${Date.now()}-${Math.random().toString(16).slice(2)}`,createdBy:prefs.memberId??"beans"};const current=state.days[date]??blankDay(date);const timeline=Array.isArray(current.timelineEvents)?current.timelineEvents:[];persist({...state,savedLogStyles:duplicate?existing:[...existing,saved],days:{...state.days,[date]:{...current,date,timelineEvents:[...timeline,{...event,type:saved.label,emoji:saved.emoji,color:saved.color}]}}},"daily-log");return saved;},
    updateDailyLogEvent:(date,id,patch)=>{const current=state.days[date]??blankDay(date);const timeline=Array.isArray(current.timelineEvents)?current.timelineEvents:[];persist({...state,days:{...state.days,[date]:{...current,date,timelineEvents:timeline.map((event)=>event.id===id?{...event,...patch}:event)}}},"daily-log");},
    deleteDailyLogEvent:(date,id)=>{const current=state.days[date]??blankDay(date);const timeline=Array.isArray(current.timelineEvents)?current.timelineEvents:[];persist({...state,days:{...state.days,[date]:{...current,date,timelineEvents:timeline.filter((event)=>event.id!==id)}}},"daily-log");},
    customSubheadings:state.customSubheadings??{},
    setCustomSubheading:(key,value)=>{const current=state.customSubheadings??{};const next={...current};const trimmed=value.trim();if(trimmed)next[key]=trimmed;else delete next[key];persist({...state,customSubheadings:next});},
    theme:activeTheme,
    setTheme:(patch)=>{persist(withSharedTheme(state,{...(activeTheme ?? {}),...patch}),"private-update");},
    namedColorThemes:state.namedColorThemes??[],
    saveNamedColorTheme:(input)=>{const existing=state.namedColorThemes??[];const duplicate=existing.find((item)=>item.name.trim().toLowerCase()===input.name.trim().toLowerCase());const saved:NamedColorTheme=duplicate?{...duplicate,...input}:{...input,id:`named-theme-${Date.now()}-${Math.random().toString(16).slice(2)}`,createdBy:prefs.memberId??"beans"};const nextState=withSharedTheme({...state,namedColorThemes:duplicate?existing.map((item)=>item.id===duplicate.id?saved:item):[...existing,saved]},{...(activeTheme ?? {}),accentColor:saved.accentColor,backgroundColor:saved.backgroundColor});persist(nextState,"private-update");},
    renameNamedColorTheme:(id,name)=>{const trimmed=name.trim();if(!trimmed)return;const existing=state.namedColorThemes??[];persist({...state,namedColorThemes:existing.map((item)=>item.id===id?{...item,name:trimmed}:item)});},
    deleteNamedColorTheme:(id)=>{const existing=state.namedColorThemes??[];persist({...state,namedColorThemes:existing.filter((item)=>item.id!==id)});},
    cleaningTemplates:state.cleaningTemplates??[],
    saveCleaningTemplate:(input)=>{const existing=state.cleaningTemplates??[];const name=input.name.trim();const tasks=input.tasks.map((task)=>task.trim()).filter(Boolean);if(!name||!tasks.length)return;const duplicate=existing.find((item)=>item.name.toLowerCase()===name.toLowerCase());const saved:CleaningTemplate=duplicate?{...duplicate,name,tasks}:{...input,id:`clean-template-${Date.now()}-${Math.random().toString(16).slice(2)}`,name,tasks,createdBy:prefs.memberId??"beans"};persist({...state,cleaningTemplates:duplicate?existing.map((item)=>item.id===duplicate.id?saved:item):[...existing,saved]});},
    updateCleaningTemplate:(id,input)=>{const name=input.name.trim();const tasks=input.tasks.map((task)=>task.trim()).filter(Boolean);if(!name||!tasks.length)return;const existing=state.cleaningTemplates??[];persist({...state,cleaningTemplates:existing.map((item)=>item.id===id?{...item,name,tasks}:item)});},
    deleteCleaningTemplate:(id)=>{const existing=state.cleaningTemplates??[];persist({...state,cleaningTemplates:existing.filter((item)=>item.id!==id)});},
    purchaseItems:state.purchaseItems??[],
    addPurchaseItem:(category,text)=>{const value=text.trim();if(!value)return;const item:PurchaseItem={id:`purchase-${Date.now()}-${Math.random().toString(16).slice(2)}`,text:value,category,addedBy:prefs.memberId??"beans",purchased:false};persist({...state,purchaseItems:[...(state.purchaseItems??[]),item]});},
    togglePurchaseItem:(id)=>{const items=state.purchaseItems??[];const actor=prefs.memberId??"beans";persist({...state,purchaseItems:items.map((item)=>item.id===id?{...item,purchased:!item.purchased,purchasedBy:item.purchased?undefined:actor,purchasedOn:item.purchased?undefined:localDateKey()}:item)});},
    deletePurchaseItem:(id)=>{const items=state.purchaseItems??[];persist({...state,purchaseItems:items.filter((item)=>item.id!==id)});},
    calendarEntries:state.calendarEntries??[],
    addCalendarEntry:(date,text)=>{const value=text.trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!value)return;const entry:CalendarEntry={id:`calendar-${Date.now()}-${Math.random().toString(16).slice(2)}`,date,text:value,createdBy:prefs.memberId??"beans",createdAt:new Date().toISOString()};persist({...state,calendarEntries:[...(state.calendarEntries??[]),entry]});},
    updateCalendarEntry:(id,text)=>{const value=text.trim();if(!value)return;persist({...state,calendarEntries:(state.calendarEntries??[]).map((entry)=>entry.id===id?{...entry,text:value}:entry)});},
    deleteCalendarEntry:(id)=>{persist({...state,calendarEntries:(state.calendarEntries??[]).filter((entry)=>entry.id!==id)});},
    tabLabels:state.tabLabels??{},
    setTabLabel:(key,label)=>{const current=state.tabLabels??{};const next={...current};const trimmed=label.trim();if(trimmed)next[key]=trimmed;else delete next[key];persist({...state,tabLabels:next});},
    tabGlyphs:state.tabGlyphs??{},
    setTabGlyph:(key,glyph)=>{const current=state.tabGlyphs??{};const next={...current};const trimmed=glyph.trim().slice(0,12);if(trimmed)next[key]=trimmed;else delete next[key];persist({...state,tabGlyphs:next});},
    setTabCustomizations:({labels,glyphs,order})=>{const nextLabels={...(state.tabLabels??{})};const nextGlyphs={...(state.tabGlyphs??{})};Object.entries(labels).forEach(([key,value])=>{const trimmed=value.trim();if(trimmed)nextLabels[key]=trimmed;else delete nextLabels[key];});Object.entries(glyphs).forEach(([key,value])=>{const trimmed=value.trim().slice(0,12);if(trimmed)nextGlyphs[key]=trimmed;else delete nextGlyphs[key];});persist({...state,tabLabels:nextLabels,tabGlyphs:nextGlyphs,tabOrder:order});},
    tabOrder:state.tabOrder??[],
    setTabOrder:(order)=>persist({...state,tabOrder:order}),
    healthPeriodVisible:state.healthPeriodVisible!==false,
    setHealthPeriodVisible:(visible)=>persist({...state,healthPeriodVisible:visible}),
    resetPersonalization:()=>{const resetState=withSharedTheme({...state,customSubheadings:{}},{});persist(resetState);},
    createRoom:async(partnerId)=>{setSyncError(null);if(isSupabaseConfigured){const result=await sbCreateRoom(state,partnerId);setRoomMembers(normalizedRoomMembers(result.memberIds));savePrefs({roomCode:result.roomCode,memberId:partnerId});return;}const result=await create.mutateAsync({journalState:state,memberId:partnerId});setRoomMembers(normalizedRoomMembers(result.memberIds));savePrefs({roomCode:result.roomCode,memberId:partnerId});},
    joinRoom:async(roomCode,partnerId)=>{setSyncError(null);const normalizedCode=roomCode.trim().toUpperCase();if(isSupabaseConfigured){const result=await sbJoinRoom(normalizedCode,partnerId);const room=await sbGetRoom(normalizedCode);if(room){const next=normalizeJournalState(room.journalState);setState(next);AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);}setRoomMembers(normalizedRoomMembers(result.memberIds));savePrefs({roomCode:normalizedCode,memberId:partnerId});return;}const result=await join.mutateAsync({roomCode:normalizedCode,memberId:partnerId});const next=result.journalState as JournalState;setState(next);setRoomMembers(normalizedRoomMembers(result.memberIds));AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);savePrefs({roomCode:result.roomCode,memberId:partnerId});},
    registerPushToken:async(token,platform)=>{if(!prefs.roomCode||!prefs.memberId)return;await registerPush.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,token,platform});await partnerAlertReadiness.refetch();}, sendTestPartnerAlert:async()=>{if(!prefs.roomCode||!prefs.memberId)return {recipientCount:0,acceptedCount:0,invalidTokens:[],message:"Open your shared room before testing alerts."};return testPartnerAlert.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId});},
  }),[ready,today,prefs,state,roomMembers,sync.isPending,remote.isFetching,syncError,partnerAlertReadiness.data,create,join,weeklyCleaningTaskAdd,registerPush,testPartnerAlert,dailyCoverUpload,dailyCoverDelete,dailyCoverCaptionUpdate,privateMediaUpload,privateMediaDirectRequest,privateMediaDirectConfirm,privateMediaDelete,privateMediaCaptionUpdate,privateMediaCommentCreate,privateMediaCommentDelete,calendarBackgroundUpload,calendarBackgroundDelete]);
  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}
export function useLocalJournal(){const value=useContext(JournalContext);if(!value)throw new Error("useLocalJournal must be used inside LocalJournalProvider");return value;}
