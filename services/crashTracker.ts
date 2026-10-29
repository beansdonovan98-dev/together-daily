import Constants from 'expo-constants';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import type { CrashContext, CrashReport } from '@/types/crash';
import {
  createFingerprint,
  diagnoseCrash,
  formatCrashTime,
  getErrorMessage,
  getErrorName,
  getErrorStack,
} from '@/utils/crashDiagnostics';
import { installGlobalErrorHandlers } from '@/utils/errorHandler';

const DATABASE_NAME = 'togetherdaily-crashes.db';
const MAX_UNSAVED_REPORTS = 50;
const MAX_STORED_REPORTS = 100;
const MAX_BREADCRUMBS = 40;

interface CrashBreadcrumb {
  at: string;
  name: string;
  data?: Record<string, unknown>;
}

interface CrashRow {
  id: number;
  fingerprint: string;
  source: string;
  name: string;
  message: string;
  stack: string;
  component_stack: string | null;
  route: string | null;
  app_version: string;
  platform: string;
  os_version: string;
  device: string;
  is_fatal: number;
  extra: string | null;
  occurrences: number;
  first_seen: string;
  last_seen: string;
  resolved: number;
  acknowledged: number;
}

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS crash_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fingerprint TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    stack TEXT NOT NULL,
    component_stack TEXT,
    route TEXT,
    app_version TEXT NOT NULL DEFAULT '',
    platform TEXT NOT NULL DEFAULT '',
    os_version TEXT NOT NULL DEFAULT '',
    device TEXT NOT NULL DEFAULT '',
    is_fatal INTEGER NOT NULL DEFAULT 0,
    extra TEXT,
    occurrences INTEGER NOT NULL DEFAULT 1,
    first_seen TEXT NOT NULL,
    last_seen TEXT NOT NULL,
    resolved INTEGER NOT NULL DEFAULT 0,
    acknowledged INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_crash_reports_last_seen ON crash_reports(last_seen DESC);
`;

const MIGRATION_ACKNOWLEDGED =
  'ALTER TABLE crash_reports ADD COLUMN acknowledged INTEGER NOT NULL DEFAULT 0';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let syncDatabase: SQLite.SQLiteDatabase | null = null;
let currentRoute = '/';
let memoryIds = -1;
let unsavedReports: CrashReport[] = [];
let initialized = false;
let breadcrumbs: CrashBreadcrumb[] = [];

const TRACKER_GLOBAL_KEY = '__recipeVaultCrashTrackerInitialized';

function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (databasePromise === null) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME)
      .then(async (database) => {
        await database.execAsync(SCHEMA);
        try {
          await database.execAsync(MIGRATION_ACKNOWLEDGED);
        } catch {
          // Column already exists on databases created after this migration shipped.
        }
        return database;
      })
      .catch((error: unknown) => {
        databasePromise = null;
        throw error;
      });
  }
  return databasePromise;
}

function getSyncDatabase(): SQLite.SQLiteDatabase {
  if (syncDatabase === null) {
    const database = SQLite.openDatabaseSync(DATABASE_NAME);
    database.execSync(SCHEMA);
    try {
      database.execSync(MIGRATION_ACKNOWLEDGED);
    } catch {
      // Column already exists on databases created after this migration shipped.
    }
    syncDatabase = database;
  }
  return syncDatabase;
}

function readDeviceInfo(): {
  appVersion: string;
  platform: string;
  osVersion: string;
  device: string;
} {
  const constants = Constants as unknown as {
    expoConfig?: {
      version?: string;
      ios?: { buildNumber?: string };
      android?: { versionCode?: number };
    };
    deviceName?: string;
    platform?: {
      ios?: { model?: string; systemVersion?: string };
    };
  };

  const platform = Platform.OS ?? 'unknown';
  let osVersion = String(Platform.Version ?? '');
  let device = constants.deviceName ?? '';

  if (platform === 'ios') {
    osVersion = constants.platform?.ios?.systemVersion ?? osVersion;
    device = constants.platform?.ios?.model ?? device;
  } else if (platform === 'android') {
    const nativeConstants = Platform.constants as unknown as {
      Manufacturer?: string;
      Brand?: string;
      Model?: string;
      Release?: string;
    };
    const manufacturer = nativeConstants?.Manufacturer ?? nativeConstants?.Brand ?? '';
    const model = nativeConstants?.Model ?? '';
    device = [manufacturer, model].filter(Boolean).join(' ') || device;
    osVersion = nativeConstants?.Release ?? osVersion;
  }

  const version = constants.expoConfig?.version ?? 'unknown';
  const build =
    platform === 'ios'
      ? constants.expoConfig?.ios?.buildNumber
      : platform === 'android'
        ? constants.expoConfig?.android?.versionCode?.toString()
        : undefined;

  return {
    appVersion: build ? `${version} (${build})` : version,
    platform,
    osVersion: osVersion || 'unknown',
    device: device || 'unknown device',
  };
}

function safeStringify(value: unknown): string | null {
  if (value === undefined) {
    return null;
  }
  try {
    const seen = new WeakSet<object>();
    return JSON.stringify(value, (_key, item) => {
      if (typeof item === 'bigint') {
        return item.toString();
      }
      if (typeof item === 'object' && item !== null) {
        if (seen.has(item)) {
          return '[Circular]';
        }
        seen.add(item);
      }
      return item;
    });
  } catch {
    try {
      return String(value);
    } catch {
      return null;
    }
  }
}

function mapRow(row: CrashRow): CrashReport {
  return {
    id: row.id,
    fingerprint: row.fingerprint,
    source: row.source,
    name: row.name,
    message: row.message,
    stack: row.stack,
    componentStack: row.component_stack,
    route: row.route,
    appVersion: row.app_version,
    platform: row.platform,
    osVersion: row.os_version,
    device: row.device,
    isFatal: row.is_fatal === 1,
    context: row.extra,
    occurrences: row.occurrences,
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
    resolved: row.resolved === 1,
  };
}

function rememberUnsaved(report: CrashReport): void {
  const existing = unsavedReports.find((item) => item.fingerprint === report.fingerprint);
  if (existing) {
    existing.occurrences += 1;
    existing.lastSeen = report.lastSeen;
    existing.stack = report.stack;
    existing.componentStack = report.componentStack;
    existing.route = report.route;
  } else {
    unsavedReports = [report, ...unsavedReports].slice(0, MAX_UNSAVED_REPORTS);
  }
}

const UPSERT_REPORT = `
  INSERT INTO crash_reports (
    fingerprint, source, name, message, stack, component_stack, route,
    app_version, platform, os_version, device, is_fatal, extra,
    occurrences, first_seen, last_seen, resolved
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0)
  ON CONFLICT(fingerprint) DO UPDATE SET
    occurrences = crash_reports.occurrences + 1,
    last_seen = excluded.last_seen,
    stack = excluded.stack,
    component_stack = excluded.component_stack,
    route = excluded.route,
    app_version = excluded.app_version,
    platform = excluded.platform,
    os_version = excluded.os_version,
    device = excluded.device,
    is_fatal = MAX(crash_reports.is_fatal, excluded.is_fatal),
    extra = excluded.extra,
    resolved = 0
`;

function persistReport(report: CrashReport): void {
  getSyncDatabase().runSync(UPSERT_REPORT, [
    report.fingerprint,
    report.source,
    report.name,
    report.message,
    report.stack,
    report.componentStack,
    report.route,
    report.appVersion,
    report.platform,
    report.osVersion,
    report.device,
    report.isFatal ? 1 : 0,
    report.context,
    report.firstSeen,
    report.lastSeen,
  ]);
  unsavedReports = unsavedReports.filter((item) => item.fingerprint !== report.fingerprint);
}

export function recordBreadcrumb(name: string, data?: Record<string, unknown>): void {
  try {
    breadcrumbs = [...breadcrumbs, { at: new Date().toISOString(), name, data }].slice(
      -MAX_BREADCRUMBS
    );
  } catch {
    // Breadcrumbs are best-effort diagnostics.
  }
}

export function recordCrash(error: unknown, context: CrashContext): void {
  try {
    const message = getErrorMessage(error);
    const name = getErrorName(error);
    const stack = getErrorStack(error, message);
    const componentStack = context.componentStack ?? null;
    const route = context.route ?? currentRoute;
    const now = new Date().toISOString();
    const device = readDeviceInfo();
    const fingerprint = createFingerprint({
      source: context.source,
      name,
      message,
      stack,
      componentStack,
    });

    const report: CrashReport = {
      id: (memoryIds -= 1),
      fingerprint,
      source: context.source,
      name,
      message,
      stack,
      componentStack,
      route,
      appVersion: device.appVersion,
      platform: device.platform,
      osVersion: device.osVersion,
      device: device.device,
      isFatal: context.isFatal === true,
      context: safeStringify({ ...(context.extra ?? {}), breadcrumbs }),
      occurrences: 1,
      firstSeen: now,
      lastSeen: now,
      resolved: false,
    };

    console.error(
      `[CRASH TRACKER] source=${context.source} fatal=${report.isFatal} route=${route}\n${name}: ${message}\n${stack}`
    );

    try {
      // Synchronous on purpose: fatal JS errors can terminate the process before an
      // asynchronous write finishes. This guarantees the report reaches disk first.
      persistReport(report);
    } catch (persistError) {
      rememberUnsaved(report);
      console.error('[CRASH TRACKER] failed to persist crash report', persistError);
    }
  } catch (trackingError) {
    try {
      console.error('[CRASH TRACKER] failed to record crash', trackingError);
    } catch {
      // Never let diagnostics throw.
    }
  }
}

export function captureException(
  error: unknown,
  options: Omit<CrashContext, 'source'> & { source: CrashContext['source'] }
): void {
  recordCrash(error, options);
}

export function initializeCrashTracker(): void {
  if (initialized) {
    return;
  }
  initialized = true;

  const target = globalThis as unknown as Record<string, unknown>;
  if (target[TRACKER_GLOBAL_KEY]) {
    return;
  }
  target[TRACKER_GLOBAL_KEY] = true;

  console.log('[CRASH TRACKER] installing global handlers');
  recordBreadcrumb('tracker:initialized');

  installGlobalErrorHandlers(
    (globalThis as unknown as { ErrorUtils?: Parameters<typeof installGlobalErrorHandlers>[0] })
      .ErrorUtils,
    globalThis as unknown as Record<string, unknown>,
    console,
    (error, handlerContext) => {
      recordBreadcrumb(`error:${handlerContext.source}`, {
        isFatal: handlerContext.isFatal,
        route: currentRoute,
      });
      captureException(error, {
        source: handlerContext.source,
        isFatal: handlerContext.isFatal,
      });
    }
  );

  void getDatabase()
    .then(() => {
      recordBreadcrumb('crash-db:ready');
    })
    .catch((error: unknown) => {
      recordBreadcrumb('crash-db:failed');
      console.error('[CRASH TRACKER] crash database unavailable, using memory buffer', error);
    });
}

export function setCurrentRoute(route: string | null): void {
  const nextRoute = route ?? '/';
  if (nextRoute !== currentRoute) {
    currentRoute = nextRoute;
    recordBreadcrumb(`route:${nextRoute}`);
  }
}

function mergeUnsavedReports(reports: CrashReport[]): CrashReport[] {
  const merged = reports.map((report) => ({ ...report }));

  for (const unsaved of unsavedReports) {
    const existing = merged.find((report) => report.fingerprint === unsaved.fingerprint);
    if (existing) {
      existing.occurrences += unsaved.occurrences;
      if (unsaved.lastSeen > existing.lastSeen) {
        existing.lastSeen = unsaved.lastSeen;
        existing.stack = unsaved.stack;
        existing.componentStack = unsaved.componentStack;
        existing.route = unsaved.route;
      }
    } else {
      merged.push({ ...unsaved });
    }
  }

  return merged.sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : a.lastSeen > b.lastSeen ? -1 : 0));
}

export async function getCrashReports(): Promise<CrashReport[]> {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync<CrashRow>(
      'SELECT * FROM crash_reports ORDER BY last_seen DESC LIMIT ?',
      [MAX_STORED_REPORTS]
    );
    return mergeUnsavedReports(rows.map(mapRow));
  } catch (error) {
    console.error('[CRASH TRACKER] failed to load crash reports', error);
    return mergeUnsavedReports([]);
  }
}

export async function getLatestUnacknowledgedFatalCrash(): Promise<CrashReport | null> {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync<CrashRow>(
      'SELECT * FROM crash_reports WHERE is_fatal = 1 AND acknowledged = 0 ORDER BY last_seen DESC LIMIT 1'
    );
    if (rows.length > 0) {
      return mapRow(rows[0]);
    }
  } catch (error) {
    console.error('[CRASH TRACKER] failed to load latest fatal crash', error);
  }

  return unsavedReports.find((report) => report.isFatal) ?? null;
}

export function acknowledgeCrash(fingerprint: string): void {
  unsavedReports = unsavedReports.filter((report) => report.fingerprint !== fingerprint);

  try {
    getSyncDatabase().runSync('UPDATE crash_reports SET acknowledged = 1 WHERE fingerprint = ?', [
      fingerprint,
    ]);
  } catch (error) {
    console.error('[CRASH TRACKER] failed to acknowledge crash report', error);
  }
}

export async function clearCrashReports(): Promise<void> {
  unsavedReports = [];

  try {
    getSyncDatabase().runSync('DELETE FROM crash_reports');
  } catch (error) {
    console.error('[CRASH TRACKER] failed to clear crash reports', error);
  }
}

export async function deleteCrashReport(fingerprint: string): Promise<void> {
  unsavedReports = unsavedReports.filter((report) => report.fingerprint !== fingerprint);

  try {
    getSyncDatabase().runSync('DELETE FROM crash_reports WHERE fingerprint = ?', [fingerprint]);
  } catch (error) {
    console.error('[CRASH TRACKER] failed to delete crash report', error);
  }
}

export async function setCrashResolved(fingerprint: string, resolved: boolean): Promise<void> {
  try {
    getSyncDatabase().runSync('UPDATE crash_reports SET resolved = ? WHERE fingerprint = ?', [
      resolved ? 1 : 0,
      fingerprint,
    ]);
  } catch (error) {
    console.error('[CRASH TRACKER] failed to update crash report', error);
  }
}

export function recordTestCrash(): void {
  captureException(new Error('Test crash recorded from the Crash Reports screen'), {
    source: 'manual-test',
    isFatal: false,
  });
}

export function formatCrashReport(report: CrashReport): string {
  const diagnosis = diagnoseCrash(report.message, report.stack);
  const lines = [
    'Recipe Vault AI crash report',
    `When: ${formatCrashTime(report.lastSeen)} (first seen ${formatCrashTime(report.firstSeen)})`,
    `Occurrences: ${report.occurrences}`,
    `Source: ${report.source}`,
    `Fatal: ${report.isFatal ? 'yes' : 'no'}`,
    `Route: ${report.route ?? 'unknown'}`,
    `App: ${report.appVersion}`,
    `Device: ${report.device}`,
    `OS: ${report.platform} ${report.osVersion}`,
    `Fingerprint: ${report.fingerprint}`,
    '',
    `Error: ${report.name}: ${report.message}`,
    '',
    `Likely cause: ${diagnosis.likelyCause}`,
    `Suggested fix: ${diagnosis.suggestedFix}`,
    '',
    'Stack trace:',
    report.stack,
  ];

  if (report.componentStack) {
    lines.push('', 'Component stack:', report.componentStack);
  }

  if (report.context) {
    lines.push('', 'Extra context:', report.context);
  }

  return lines.join('\n');
}
