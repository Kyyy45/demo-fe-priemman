/** Normalized response from the workspace calendar integration. */
export interface CalendarWorkspaceResponse {
  status?: unknown;
  message?: unknown;
  username?: unknown;
  events?: unknown;
}

export interface CalendarEvent {
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
}

export interface CalendarWorkspace {
  status: "success";
  message: string;
  username: string;
  events: CalendarEvent[];
}
