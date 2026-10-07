import type { Project as ApiProject } from "./project";

export type SortId = "forYou" | "popular" | "latest";
export type Project = {
  id: string;
  title: string;
  /** Raw tags supplied by the project API; Priemman has no discipline taxonomy. */
  tags: string[];
  primaryTag: string;
  author: { name: string; avatarUrl?: string; headline?: string; pro: boolean };
  likes: number;
  views: number;
  ageDays: number;
  image: string;
  source?: ApiProject;
};
