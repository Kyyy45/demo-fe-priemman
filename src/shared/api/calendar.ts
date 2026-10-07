import { PRIEMMAN_API_VERSION } from "./config";
import { priemmanApiClient } from "./core/client";
import { ApiError } from "./core/errors";
import type {
  CalendarEvent,
  CalendarWorkspace,
  CalendarWorkspaceResponse,
} from "@/shared/lib/types/calendar";

// Alur Calendar mengikuti WORKSPACE_CALENDAR_CONTRACT.md: request JSON, validasi
// status backend, normalisasi event, lalu kirim bentuk aman ke calendar UI pada
// dashboard-user. API layer menjadi batas antara payload provider dan komponen.
function parseCalendarEvent(value: unknown): CalendarEvent | null {
  if (!value || typeof value !== "object") return null;

  const event = value as Record<string, unknown>;
  if (typeof event.start !== "string" || !event.start) return null;

  return {
    title: typeof event.title === "string" ? event.title : "",
    description: typeof event.description === "string" ? event.description : "",
    start: event.start,
    end: typeof event.end === "string" ? event.end : "",
    location: typeof event.location === "string" ? event.location : "",
  };
}

export const calendarService = {
  // Satu-satunya operasi domain: ambil workspace calendar tanpa cache agar
  // dashboard selalu menerima event terbaru untuk user session aktif.
  async getWorkspace(): Promise<CalendarWorkspace> {
    const response =
      await priemmanApiClient.requestJson<CalendarWorkspaceResponse>(
        `${PRIEMMAN_API_VERSION}/workspace/calendar`,
        { method: "GET", cache: "no-store" },
      );

    if (response.status !== "success") {
      throw new ApiError({
        code: "CALENDAR_UNAVAILABLE",
        message:
          typeof response.message === "string"
            ? response.message
            : "Calendar is unavailable",
        status: 502,
      });
    }

    const events = Array.isArray(response.events)
      ? response.events
          .map(parseCalendarEvent)
          .filter((event): event is CalendarEvent => event !== null)
      : [];

    return {
      status: "success",
      message: typeof response.message === "string" ? response.message : "",
      username: typeof response.username === "string" ? response.username : "",
      events,
    };
  },
};
