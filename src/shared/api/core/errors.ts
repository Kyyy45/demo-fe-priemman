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

export function getErrorMessage(
  error: unknown,
  fallback = "Unexpected request error",
) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;

  return fallback;
}
