import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const STORAGE_KEY = "together-daily-crash-log";
const MAX_ENTRIES = 50;

export type CrashEntry = {
  id: string;
  name: string;
  message: string;
  stack: string;
  source: string;
  createdAt: string;
};

let initialized = false;

async function readEntries(): Promise<CrashEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeEntries(entries: CrashEntry[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // ignore
  }
}

export async function recordCrash(error: unknown, source = "unknown") {
  const entry: CrashEntry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: error instanceof Error ? error.name || "Error" : typeof error,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? (error.stack ?? "") : "",
    source,
    createdAt: new Date().toISOString(),
  };
  const entries = await readEntries();
  entries.unshift(entry);
  await writeEntries(entries);
}

export async function getCrashLogs(): Promise<CrashEntry[]> {
  return readEntries();
}

export async function clearCrashLogs() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function initCrashLogging() {
  if (initialized) return;
  initialized = true;

  const g = globalThis as any;
  if (typeof g.ErrorUtils?.setGlobalHandler === "function") {
    const previous = g.ErrorUtils.getGlobalHandler?.();
    g.ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
      void recordCrash(error, isFatal ? "fatal" : "global-error");
      if (typeof previous === "function") previous(error, isFatal);
    });
  }

  if (typeof g.onunhandledrejection === "undefined") {
    g.onunhandledrejection = (event: any) => {
      void recordCrash(event?.reason ?? event, "unhandled-rejection");
    };
  }
}