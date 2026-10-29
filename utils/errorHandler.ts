type GlobalErrorHandler = (error: unknown, isFatal?: boolean) => void;

export type ErrorUtilsLike = {
  getGlobalHandler?: () => GlobalErrorHandler | undefined;
  setGlobalHandler?: (handler: GlobalErrorHandler) => void;
};

type ErrorTarget = Record<string, unknown>;

export type ErrorReporter = (
  error: unknown,
  context: { source: string; isFatal?: boolean }
) => void;

export function describeError(error: unknown): string {
  if (error instanceof Error) return error.stack ?? error.message;
  try {
    return String(error);
  } catch {
    return "Unprintable error";
  }
}

export function installGlobalErrorHandlers(
  errorUtils: ErrorUtilsLike | undefined,
  target: ErrorTarget = globalThis as unknown as ErrorTarget,
  logger: Pick<Console, "error"> = console,
  reporter?: ErrorReporter
): void {
  if (
    errorUtils &&
    typeof errorUtils.getGlobalHandler === "function" &&
    typeof errorUtils.setGlobalHandler === "function"
  ) {
    let originalHandler: GlobalErrorHandler | undefined;
    try {
      originalHandler = errorUtils.getGlobalHandler();
    } catch {
      originalHandler = undefined;
    }

    try {
      errorUtils.setGlobalHandler((error, isFatal) => {
        try {
          logger.error(`[GLOBAL ERROR] isFatal=${isFatal}\nStack trace:\n${describeError(error)}`);
        } catch {
          // Diagnostics must never throw.
        }
        try {
          reporter?.(error, { source: "global-error", isFatal });
        } catch {
          // Diagnostics must never throw.
        }
        if (typeof originalHandler === "function") {
          originalHandler(error, isFatal);
        }
      });
    } catch {
      // Diagnostics must never prevent the app from starting.
    }
  }

  if (typeof target.onunhandledrejection === "undefined") {
    target.onunhandledrejection = (event: unknown) => {
      const reason = (event as { reason?: unknown } | undefined)?.reason;
      try {
        logger.error(`[UNHANDLED PROMISE REJECTION]\nStack trace:\n${describeError(reason)}`);
      } catch {
        // Diagnostics must never throw.
      }
      try {
        reporter?.(reason, { source: "unhandled-rejection", isFatal: false });
      } catch {
        // Diagnostics must never throw.
      }
    };
  }
}