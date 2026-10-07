"use client";

import { useEffect, useState } from "react";

import { CreatorProfileCard } from "@/shared/components/project-detail/creator-profile-card";
import { ProjectCard } from "@/shared/components/project-card";
import { userService } from "@/shared/api";
import { loadPublicFeed } from "@/shared/api/public-feed";
import type { Project } from "@/shared/lib/types/project";
import type { Project as ProjectCardData } from "@/shared/lib/types/explore";
import type { PublicCreatorProfile as PublicCreatorProfileShape } from "@/shared/lib/types/public-creator-profile";
import { getMediaDeliveryUrl } from "@/shared/lib/media-url";
import { useT } from "@/shared/providers/language-provider";
import { Skeleton } from "@/shared/ui/skeleton";

interface PublicCreatorProfileProps {
  creatorId: string;
}

interface CreatorPageData {
  avatarUrl: string;
  name: string;
  profile: PublicCreatorProfileShape;
}

export function PublicCreatorProfile({ creatorId }: PublicCreatorProfileProps) {
  const strings = useT().projectDetail;
  const [creator, setCreator] = useState<CreatorPageData | null>(null);
  const [creatorProjects, setCreatorProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(Boolean(creatorId));

  // Memuat profil publik dan project published langsung dari kontrak User backend.
  useEffect(() => {
    if (!creatorId) {
      return;
    }

    let active = true;
    // 1. Profil dan project adalah resource publik terpisah. Kegagalan profile
    // tidak boleh menghapus project yang sudah berhasil dikembalikan backend.
    // Feed publik dipakai sebagai cadangan: endpoint project publik backend
    // saat ini membaca user_id dari path (route-nya tanpa {user_id}) sehingga
    // selalu kosong, dan feed membawa `author` untuk nama/avatar/headline.
    void Promise.allSettled([
      userService.getPublicProfile(creatorId),
      userService.listPublicProjects(creatorId, 20, 0),
      loadPublicFeed(),
    ]).then(([profileResult, projectsResult, feedResult]) => {
        if (!active) return;
        const listedProjects =
          projectsResult.status === "fulfilled"
            ? projectsResult.value.projects
            : [];
        const feedProjects =
          feedResult.status === "fulfilled"
            ? feedResult.value.filter(
                (project) =>
                  project.ownerId === creatorId ||
                  project.author?.id === creatorId,
              )
            : [];
        const projects = listedProjects.length ? listedProjects : feedProjects;
        setCreatorProjects(projects);
        const firstAuthor = projects.find((project) => project.author)?.author;
        const profile =
          profileResult.status === "fulfilled" ? profileResult.value : null;
        if (!profile && !firstAuthor) {
          setLoading(false);
          return;
        }
        setCreator({
          avatarUrl: profile?.avatarUrl || firstAuthor?.avatarUrl || "",
          name:
            [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
            [firstAuthor?.firstName, firstAuthor?.lastName]
              .filter(Boolean)
              .join(" ") ||
            "Priemman Creator",
          profile: {
            aboutDescription: profile?.aboutDescription || "",
            aboutTitle: profile?.aboutTitle || "",
            company: profile?.company || "",
            headline: profile?.headline || firstAuthor?.headline || "",
            location: {
              city: profile?.city || "",
              country: profile?.country || "",
            },
            socialLinks: {},
            websiteUrl: profile?.websiteUrl || "",
            workExperience: profile?.workExperience || [],
          },
        });
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [creatorId]);

  if (loading) {
    return (
      <Skeleton className="h-[420px] w-full rounded-[var(--radius-feature)]" />
    );
  }

  if (!creator) {
    return (
      <div className="rounded-[var(--radius-feature)] bg-surface-muted/35 px-6 py-20 text-center">
        <h1 className="type-section-title font-semibold">
          {strings.profileUnavailable}
        </h1>
        <a
          className="mt-6 inline-flex rounded-full bg-heading px-5 py-3 type-label font-semibold text-canvas"
          href="/explore"
        >
          {strings.backToExplore}
        </a>
      </div>
    );
  }

  const cards: ProjectCardData[] = creatorProjects.map((project) => {
    const cover =
      project.media.find((media) => media.id === project.coverMediaId)?.url ??
      project.media.find((media) => media.type === 1)?.url ??
      "";
    return {
      ageDays: 0,
      author: {
        avatarUrl: creator.avatarUrl,
        headline: creator.profile.headline,
        name: creator.name,
        pro: false,
      },
      primaryTag: project.tags[0] ?? "",
      id: project.id,
      image: getMediaDeliveryUrl(cover, { width: 800 }),
      likes: project.metrics.likes,
      source: project,
      tags: project.tags,
      title: project.title,
      views: project.metrics.views,
    };
  });

  return (
    <>
      <CreatorProfileCard
        avatarUrl={creator.avatarUrl}
        name={creator.name}
        profile={creator.profile}
        standalone
      />
      <section className="mt-16">
        <div className="flex min-w-0 items-end justify-between gap-4 border-b border-border-subtle pb-5">
          <div className="min-w-0">
            <p className="type-label text-copy-secondary">
              {cards.length} {strings.projects}
            </p>
            <h2 className="mt-1 type-section-title font-semibold tracking-tight">
              {strings.creatorProjects}
            </h2>
          </div>
        </div>
        {cards.length ? (
          <div className="mt-8 grid min-w-0 gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-large:grid-cols-3">
            {cards.map((project) => (
              <ProjectCard
                interactive={false}
                key={project.id}
                likeAria={strings.like}
                onOpen={() =>
                  window.location.replace(
                    `/explore?project=${encodeURIComponent(project.id)}`,
                  )
                }
                project={project}
              />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center type-body text-copy-secondary">
            {strings.noCreatorProjects}
          </p>
        )}
      </section>
    </>
  );
}
