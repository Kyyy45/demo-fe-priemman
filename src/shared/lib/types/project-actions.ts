/** Contracts derived from proto/user.proto project-summary messages. */
export type ProjectAction = "liked" | "saved";

export interface ProjectSummary {
  projectId: string;
  title: string;
  thumbnail?: string;
  firstName: string;
  lastName: string;
}

export interface ListProjectActionsInput {
  limit?: number;
  offset?: number;
}
