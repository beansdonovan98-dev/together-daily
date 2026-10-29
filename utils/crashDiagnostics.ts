import type { CrashDiagnosis } from "@/types/crash";

const MAX_FINGERPRINT_INPUT = 4000;

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || error.name || "Unknown error";
  try {
    const value = String(error);
    return value || "Unknown error";
  } catch {
    return "Unprintable error";
  }
}

export function getErrorName(error: unknown): string {
  if (error instanceof Error) return error.name || "Error";
  return typeof error;
}

export function getErrorStack(error: unknown, fallbackMessage?: string): string {
  if (error instanceof Error) return error.stack ?? `${error.name}: ${error.message}`;
  try {
    return `${typeof error}: ${String(error)}`;
  } catch {
    return fallbackMessage ?? "Unprintable error";
  }
}

export function getTopStackFrame(stack: string | null | undefined): string {
  if (!stack) return "no-stack";
  const lines = stack.split("\n");
  const frame = lines.find((line) => /^\s+at\s/.test(line)) ?? lines.find((line) => line.trim().length > 0);
  if (!frame) return "no-stack";
  return (
    frame
      .replace(/^\s+at\s+/, "")
      .replace(/\(.*?:\d+:\d+\)$/, "")
      .replace(/:\d+:\d+$/, "")
      .replace(/\?[^)]*$/, "")
      .trim()
      .slice(0, 300) || "no-stack"
  );
}

function hashString(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createFingerprint(params: { source: string; name: string; message: string; stack?: string | null; componentStack?: string | null }): string {
  const topFrame = getTopStackFrame(params.stack);
  const firstComponent = (params.componentStack ?? "")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0) ?? "";
  const normalizedMessage = params.message.toLowerCase().replace(/\d+/g, "#").trim();
  const input = [params.source, params.name, normalizedMessage, topFrame, firstComponent].join("|").slice(0, 4000);
  return `${params.source}:${hashString(input)}`;
}

export function diagnoseCrash(message: string, stack?: string | null): CrashDiagnosis {
  return { likelyCause: "Unknown", suggestedFix: "Inspect the stack trace." };
}

export function formatCrashTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}