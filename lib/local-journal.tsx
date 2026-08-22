import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STATE_KEY = "together-daily-journal-v2";
const ROOM_KEY = "together-daily-room-v1";
export type PartnerId = "beans" | "princess";
export const PARTNERS = {
  beans: { id: "beans" as const, name: "Beans", color: "#8D5BA6", soft: "#F1EAF7", avatar: "B" },
  princess: { id: "princess" as const, name: "Princess", color: "#D56B88", soft: "#FCEAF0", avatar: "P" },
};

type RecordType = "chat" | "loveNote" | "intimacy" | "cumLog" | "steamyChat" | "habit" | "dateIdea";
type PartnerNotificationType = "daily-log" | "love-note" | "todo" | "private-update";
export type LocalRecord = { id: string; authorId: PartnerId; recordType: RecordType; content: Record<string, unknown>; createdAt: string };
export type LocalMedia = { id: string; kind: "cover" | "photo" | "private"; url: string; fileName: string; mimeType: string; caption: string; createdAt: string; dailyDate: string; uploadedBy?: PartnerId };
export type SavedLogStyle = { id: string; label: string; emoji: string; color: string; createdBy: PartnerId };
export type SharedThemePreferences = { accentColor?: string; backgroundColor?: string };
type JournalState = { days: Record<string, Record<string, any>>; records: LocalRecord[]; media: LocalMedia[]; savedLogStyles?: SavedLogStyle[]; customSubheadings?: Record<string, string>; theme?: SharedThemePreferences; customHeaders?: Record<string, string> };
type RoomPrefs = { roomCode: string | null; memberId: PartnerId | null };

const QUESTIONS = ["What was a small moment today where you felt deeply loved or appreciated?", "What habit or quality in me has positively influenced your own life recently?", "How can I support you or lighten your mental load over the next 48 hours?", "What is your favorite quiet, unscripted memory of us from this past year?", "Describe our dream Sunday morning five years from now in three vivid sentences.", "What new experience would you love for us to try together before the year ends?", "What did you honestly think in the first ten minutes after we first met?"];
function blankDay(date: string): Record<string, any> { const [year, month, day] = date.split("-").map(Number); const i = Math.abs(Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)) % QUESTIONS.length; return { date, title:"Daily Check-in", rating:null, weather:null, tags:[], pinned:false, coverPhoto:null, sharedHighlight:"", questionId:`daily-${i+1}`, questionText:QUESTIONS[i], todos:[], meals:{breakfast:"",breakfastDone:false,lunch:"",lunchDone:false,dinner:"",dinnerDone:false,prepGrocery:"",prepGroceryDone:false}, water:{slots:[],glassesLogged:0,dailyGoalGlasses:8}, notesList:[],timelineEvents:[],checkIns:{},photos:[],sharedNotes:"" }; }

type JournalContextValue = { ready:boolean; roomCode:string|null; memberId:PartnerId|null; roomMembers:PartnerId[]; partner:typeof PARTNERS[PartnerId]|null; isSyncing:boolean; syncError:string|null; getDay:(date:string)=>Record<string,any>; ensureDay:(date:string)=>void; updateDay:(date:string,patch:Record<string,unknown>,notificationType?:PartnerNotificationType)=>void; allDays:Record<string,any>[]; records:LocalRecord[]; addRecord:(recordType:RecordType,content:Record<string,unknown>)=>void; media:LocalMedia[]; addMedia:(media:Omit<LocalMedia,"id"|"createdAt"|"uploadedBy">)=>LocalMedia; savedLogStyles:SavedLogStyle[]; saveLogStyle:(style:Omit<SavedLogStyle,"id"|"createdBy">)=>SavedLogStyle; addDailyLogEvent:(date:string,event:{id:string;text:string;authorId:PartnerId;createdAt:string},style:Omit<SavedLogStyle,"id"|"createdBy">)=>SavedLogStyle; customSubheadings:Record<string,string>; setCustomSubheading:(key:string,value:string)=>void; theme:SharedThemePreferences; setTheme:(patch:SharedThemePreferences)=>void; createRoom:(partnerId:PartnerId)=>Promise<void>; joinRoom:(roomCode:string,partnerId:PartnerId)=>Promise<void>; registerPushToken:(token:string,platform:"android"|"ios")=>Promise<void>; };
const JournalContext = createContext<JournalContextValue | null>(null);

function normalizedRoomMembers(value: unknown): PartnerId[] {
  return Array.isArray(value) ? value.filter((member): member is PartnerId => member === "beans" || member === "princess") : [];
}

export function LocalJournalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JournalState>({ days:{}, records:[], media:[] }); const [prefs, setPrefs] = useState<RoomPrefs>({ roomCode:null, memberId:null }); const [roomMembers, setRoomMembers] = useState<PartnerId[]>([]); const [ready, setReady] = useState(false); const [syncError, setSyncError] = useState<string|null>(null);
  const create = trpc.guestRoom.create.useMutation(); const join = trpc.guestRoom.join.useMutation(); const sync = trpc.guestRoom.update.useMutation(); const registerPush = trpc.guestRoom.registerPushToken.useMutation();
  const remote = trpc.guestRoom.get.useQuery({ roomCode:prefs.roomCode ?? "" }, { enabled: ready && Boolean(prefs.roomCode), refetchInterval:3_000, retry:1 });
  useEffect(()=>{Promise.all([AsyncStorage.getItem(STATE_KEY),AsyncStorage.getItem(ROOM_KEY)]).then(([storedState,storedPrefs])=>{if(storedState){try{setState(JSON.parse(storedState))}catch{}} if(storedPrefs){try{setPrefs(JSON.parse(storedPrefs))}catch{}}}).finally(()=>setReady(true));},[]);
  useEffect(()=>{if(!remote.data) return; const next=remote.data.journalState as JournalState; const current=JSON.stringify(state); const incoming=JSON.stringify(next); if(current!==incoming){setState(next); AsyncStorage.setItem(STATE_KEY,incoming).catch(()=>undefined);} const nextMembers=normalizedRoomMembers(remote.data.memberIds);setRoomMembers(currentMembers=>currentMembers.length===nextMembers.length&&currentMembers.every(member=>nextMembers.includes(member))?currentMembers:nextMembers);},[remote.data]);
  const savePrefs=(next:RoomPrefs)=>{setPrefs(next); AsyncStorage.setItem(ROOM_KEY,JSON.stringify(next)).catch(()=>undefined);};
  const persist=(next:JournalState,notificationType?:PartnerNotificationType)=>{setState(next); const serialized=JSON.stringify(next); AsyncStorage.setItem(STATE_KEY,serialized).catch(()=>undefined); if(prefs.roomCode){sync.mutate({roomCode:prefs.roomCode,journalState:next,actorId:prefs.memberId??undefined,notificationType},{onError:(error)=>setSyncError(error.message)});}};
  const ensureDay=(date:string)=>{if(!state.days[date])persist({...state,days:{...state.days,[date]:blankDay(date)}});};
  const value=useMemo<JournalContextValue>(()=>({
    ready, roomCode:prefs.roomCode, memberId:prefs.memberId, roomMembers, partner:prefs.memberId?PARTNERS[prefs.memberId]:null, isSyncing:sync.isPending||remote.isFetching, syncError,
    getDay:(date)=>state.days[date]??blankDay(date), ensureDay, updateDay:(date,patch,notificationType)=>{const current=state.days[date]??blankDay(date);persist({...state,days:{...state.days,[date]:{...current,...patch,date}}},notificationType);}, allDays:Object.values(state.days).sort((a,b)=>String(b.date).localeCompare(String(a.date))), records:state.records,
    addRecord:(recordType,content)=>{const authorId=prefs.memberId??"beans";const record:LocalRecord={id:`record-${Date.now()}-${Math.random().toString(16).slice(2)}`,authorId,recordType,content,createdAt:new Date().toISOString()};persist({...state,records:[...state.records,record]},"private-update");}, media:state.media,
    addMedia:(input)=>{const media:LocalMedia={...input,id:`media-${Date.now()}-${Math.random().toString(16).slice(2)}`,createdAt:new Date().toISOString(),uploadedBy:prefs.memberId??"beans"};persist({...state,media:[media,...state.media]});return media;},
    savedLogStyles:state.savedLogStyles??[],
    saveLogStyle:(style)=>{const existing=state.savedLogStyles??[];const duplicate=existing.find((item)=>item.label.trim().toLowerCase()===style.label.trim().toLowerCase()&&item.emoji===style.emoji&&item.color===style.color);if(duplicate)return duplicate;const saved:SavedLogStyle={...style,id:`log-style-${Date.now()}-${Math.random().toString(16).slice(2)}`,createdBy:prefs.memberId??"beans"};persist({...state,savedLogStyles:[...existing,saved]},"daily-log");return saved;},
    addDailyLogEvent:(date,event,style)=>{const existing=state.savedLogStyles??[];const duplicate=existing.find((item)=>item.label.trim().toLowerCase()===style.label.trim().toLowerCase()&&item.emoji===style.emoji&&item.color===style.color);const saved=duplicate??{...style,id:`log-style-${Date.now()}-${Math.random().toString(16).slice(2)}`,createdBy:prefs.memberId??"beans"};const current=state.days[date]??blankDay(date);const timeline=Array.isArray(current.timelineEvents)?current.timelineEvents:[];persist({...state,savedLogStyles:duplicate?existing:[...existing,saved],days:{...state.days,[date]:{...current,date,timelineEvents:[...timeline,{...event,type:saved.label,emoji:saved.emoji,color:saved.color}]}}},"daily-log");return saved;},
    customSubheadings:state.customSubheadings??{},
    setCustomSubheading:(key,value)=>{const current=state.customSubheadings??{};const next={...current};const trimmed=value.trim();if(trimmed)next[key]=trimmed;else delete next[key];persist({...state,customSubheadings:next});},
    theme:state.theme??{},
    setTheme:(patch)=>persist({...state,theme:{...(state.theme??{}),...patch}}),
    createRoom:async(partnerId)=>{setSyncError(null);const result=await create.mutateAsync({journalState:state,memberId:partnerId});setRoomMembers(normalizedRoomMembers(result.memberIds));savePrefs({roomCode:result.roomCode,memberId:partnerId});},
    joinRoom:async(roomCode,partnerId)=>{setSyncError(null);const result=await join.mutateAsync({roomCode:roomCode.trim().toUpperCase(),memberId:partnerId});const next=result.journalState as JournalState;setState(next);setRoomMembers(normalizedRoomMembers(result.memberIds));AsyncStorage.setItem(STATE_KEY,JSON.stringify(next)).catch(()=>undefined);savePrefs({roomCode:result.roomCode,memberId:partnerId});},
    registerPushToken:async(token,platform)=>{if(!prefs.roomCode||!prefs.memberId)return;await registerPush.mutateAsync({roomCode:prefs.roomCode,partnerId:prefs.memberId,token,platform});},
  }),[ready,prefs,state,roomMembers,sync.isPending,remote.isFetching,syncError,create,join,registerPush]);
  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}
export function useLocalJournal(){const value=useContext(JournalContext);if(!value)throw new Error("useLocalJournal must be used inside LocalJournalProvider");return value;}
