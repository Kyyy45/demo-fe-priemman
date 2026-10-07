import { projectService } from "./project";
import type { Project } from "@/shared/lib/types/project";

// Feed publik (PUBLISHED + PUBLIC) yang di-cache bersama untuk kebutuhan
// sampingan yang belum punya endpoint sendiri di backend: pencarian creator
// (creator-directory) dan sampul proyek liked/saved (project-actions).
const MAX_FEED_PAGES = 6;
const CACHE_MS = 5 * 60_000;

let cached: { at: number; promise: Promise<Project[]> } | null = null;

async function fetchPublicFeed() {
  const projects: Project[] = [];
  let pageToken = "";
  for (let page = 0; page < MAX_FEED_PAGES; page++) {
    const result = await projectService.list({ pageSize: 50, pageToken }, true);
    projects.push(...result.projects);
    if (!result.nextPageToken) break;
    pageToken = result.nextPageToken;
  }
  return projects;
}

export function loadPublicFeed() {
  if (!cached || Date.now() - cached.at > CACHE_MS) {
    const promise = fetchPublicFeed();
    cached = { at: Date.now(), promise };
    promise.catch(() => {
      cached = null;
    });
  }
  return cached.promise;
}

// URL sampul sebuah proyek: media `cover_media_id`, atau gambar pertama.
export function projectCoverUrl(project: Project) {
  const media = [...project.media].sort(
    (left, right) => left.order - right.order,
  );
  return (
    media.find((item) => item.id === project.coverMediaId)?.url ??
    media.find((item) => item.type === 1)?.url ??
    ""
  );
}
