export class ActionError extends Error {
  code: string;
  details?: string;

  constructor(code: string, message: string, details?: string) {
    super(message);
    this.name = "ActionError";
    this.code = code;
    this.details = details;
  }
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; errorCode: string; errorMessage: string; errorDetails?: string };

export function asActionError(
  error: unknown,
  fallbackCode = "UNKNOWN",
  fallbackMessage = "操作失败"
): ActionError {
  if (error instanceof ActionError) return error;
  if (error instanceof Error) return new ActionError(fallbackCode, error.message);
  return new ActionError(fallbackCode, fallbackMessage);
}

export async function runLoggedAction<T>(name: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const normalized = asActionError(error);
    console.error(`[action:${name}] ${normalized.code}: ${normalized.message}`, normalized.details ?? "");
    throw normalized;
  }
}

export async function runActionResult<T>(
  name: string,
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    const normalized = asActionError(error);
    console.error(`[action:${name}] ${normalized.code}: ${normalized.message}`, normalized.details ?? "");
    return {
      ok: false,
      errorCode: normalized.code,
      errorMessage: normalized.message,
      errorDetails: normalized.details,
    };
  }
}
