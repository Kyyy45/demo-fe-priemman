import type { ApiErrorPayload } from "@/shared/lib/types/http";

export class ApiError extends Error {
  readonly code?: string;
  readonly status: number;

  constructor({ code, message, status }: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

// Sesi habis/tidak valid → dashboard mengarahkan ke /login. Dipakai bersama
// dashboard user, creator, dan admin.
export function isInvalidSessionError(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  if ([400, 401, 403].includes(error.status)) return true;
  return /unauthenticated|unauthorized|invalid.?session|session.?expired/i.test(
    error.code ?? "",
  );
}

// Backend mengirim `Result.error_detail.code` dengan pesan bahasa Inggris.
// Kode yang ada di `messages` diterjemahkan; sisanya memakai pesan backend.
export function getLocalizedErrorMessage(
  error: unknown,
  messages: Record<string, string>,
  fallback: string,
) {
  if (error instanceof ApiError && error.code && messages[error.code]) {
    return messages[error.code];
  }
  return getErrorMessage(error, fallback);
}

export function getErrorMessage(
  error: unknown,
  fallback = "Unexpected request error",
) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;

  return fallback;
}
