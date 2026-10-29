export type CrashSource =
  | "global-error"
  | "unhandled-rejection"
  | "react-error-boundary"
  | "database-init"
  | "manual-test"
  | (string & {});

export interface CrashContext {
  source: CrashSource;
  isFatal?: boolean;
  route?: string | null;
  componentStack?: string | null;
  extra?: Record<string, unknown>;
}

export interface CrashReport {
  id: number;
  fingerprint: string;
  source: CrashSource;
  name: string;
  message: string;
  stack: string;
  componentStack: string | null;
  route: string | null;
  appVersion: string;
  platform: string;
  osVersion: string;
  device: string;
  isFatal: boolean;
  context: string | null;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  resolved: boolean;
}

export interface CrashDiagnosis {
  likelyCause: string;
  suggestedFix: string;
}