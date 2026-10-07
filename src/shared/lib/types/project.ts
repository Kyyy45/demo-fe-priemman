import type { UploadedMedia } from "./media";

/** Contracts derived from proto/project.proto. */
export type ProjectVisibility = "unspecified" | "public" | "unlisted" | "draft";
export type ProjectStatus = "unspecified" | "draft" | "published" | "archived";

export interface ProjectMedia {
  url: string;
  type: number;
  order: number;
  id: string;
  publicId: string;
}

export interface ProjectCollaborator {
  userId: string;
  role: string;
}

export interface ProjectMetrics {
  views: number;
  likes: number;
  saves: number;
}

export interface ProjectAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  headline: string;
}

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  content: string;
  tags: string[];
  coverMediaId: string;
  media: ProjectMedia[];
  collaborators: ProjectCollaborator[];
  visibility: ProjectVisibility;
  status: ProjectStatus;
  metrics: ProjectMetrics;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  author: ProjectAuthor | null;
}

export interface ProjectInput {
  title: string;
  tags: string[];
  media: Array<ProjectMedia | UploadedMedia>;
  collaborators: ProjectCollaborator[];
  visibility: ProjectVisibility;
  status: ProjectStatus;
  coverMediaId?: string;
  content: string;
}

export interface ListProjectsInput {
  status?: Exclude<ProjectStatus, "unspecified">;
  pageSize?: number;
  pageToken?: string;
}

export interface ListProjectsResult {
  projects: Project[];
  nextPageToken: string;
}
