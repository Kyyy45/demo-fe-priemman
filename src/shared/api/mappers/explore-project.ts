import type { Project as ApiProject } from "@/shared/lib/types/project";
import type { Project as ExploreProject } from "@/shared/lib/types/explore";
import { getMediaDeliveryUrl } from "@/shared/lib/media-url";

/** Converts a transport project into the presentation model used by Explore. */
export function toExploreProject(
  project: ApiProject,
  now = Date.now(),
): ExploreProject {
  const authorName = project.author
    ? [project.author.firstName, project.author.lastName]
        .filter(Boolean)
        .join(" ")
    : "";
  const cover =
    project.media.find((media) => media.id === project.coverMediaId)?.url ??
    project.media.find((media) => media.type === 1)?.url ??
    "";
  const published = project.publishedAt
    ? new Date(project.publishedAt).getTime()
    : now;
  const tags = project.tags.map((tag) => tag.trim()).filter(Boolean);

  return {
    id: project.id,
    title: project.title,
    tags,
    primaryTag: tags[0] ?? "",
    author: {
      name: authorName || "Priemman Creator",
      avatarUrl: project.author?.avatarUrl || undefined,
      headline: project.author?.headline || undefined,
      pro: false,
    },
    likes: project.metrics.likes,
    views: project.metrics.views,
    ageDays: Math.max(0, Math.floor((now - published) / 86_400_000)),
    image: getMediaDeliveryUrl(cover, { width: 800 }),
    source: project,
  };
}
