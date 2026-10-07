"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  CalendarBlank,
  FolderSimple,
  Globe,
  MapPin,
  ShareNetwork,
  UserCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { ProjectCard } from "@/shared/components/project-card";
import { ProjectAvatar } from "@/shared/components/project-detail/primitives";
import { userService } from "@/shared/api";
import { loadPublicFeed, projectCoverUrl } from "@/shared/api/public-feed";
import type { Project } from "@/shared/lib/types/project";
import type { Project as ProjectCardData } from "@/shared/lib/types/explore";
import type { WorkExperience } from "@/shared/lib/types/user";
import { getMediaDeliveryUrl } from "@/shared/lib/media-url";
import { useLanguage } from "@/shared/providers/language-provider";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

interface PublicCreatorProfileProps {
  creatorId: string;
}

// Hanya data yang memang dikirim backend (GET /v1/users/public dan
// /v1/users/public/projects). Email sengaja tidak disimpan/ditampilkan.
interface CreatorPageData {
  avatarUrl: string;
  name: string;
  headline: string;
  aboutTitle: string;
  aboutDescription: string;
  company: string;
  location: string;
  websiteUrl: string;
  joinAt: string;
  workExperience: WorkExperience[];
}

type ProfileTab = "projects" | "about";

const PANEL_CLASS =
  "rounded-[var(--radius-feature)] border border-border-subtle bg-surface-raised";

function formatDate(value: string, locale: string, month: "short" | "long") {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { month, year: "numeric" }).format(
    date,
  );
}

export function PublicCreatorProfile({ creatorId }: PublicCreatorProfileProps) {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const strings = t.projectDetail;
  const locale = lang === "id" ? "id-ID" : "en-US";
  const [creator, setCreator] = useState<CreatorPageData | null>(null);
  const [creatorProjects, setCreatorProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(Boolean(creatorId));
  const [tab, setTab] = useState<ProfileTab>("projects");

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
    ])
      .then(([profileResult, projectsResult, feedResult]) => {
        if (!active) return;
        // Backend hanya memfilter status PUBLISHED; proyek UNLISTED tidak
        // boleh tampil di profil publik, jadi disaring di sini.
        const listedProjects =
          projectsResult.status === "fulfilled"
            ? projectsResult.value.projects.filter(
                (project) => project.visibility === "public",
              )
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
          headline: profile?.headline || firstAuthor?.headline || "",
          aboutTitle: profile?.aboutTitle || "",
          aboutDescription: profile?.aboutDescription || "",
          company: profile?.company || "",
          location: [profile?.city, profile?.country]
            .filter(Boolean)
            .join(", "),
          websiteUrl: /^https?:\/\//i.test(profile?.websiteUrl ?? "")
            ? (profile?.websiteUrl ?? "")
            : "",
          joinAt: profile?.joinAt || "",
          workExperience: profile?.workExperience || [],
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
      <div className="space-y-[var(--grid-gap)]">
        <Skeleton className="h-[24rem] w-full rounded-[var(--radius-feature)]" />
        <div className="grid gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-expanded:grid-cols-3 m3-large:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton
              className="aspect-[4/5] rounded-[var(--radius-feature)]"
              key={index}
            />
          ))}
        </div>
      </div>
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

  const cards: ProjectCardData[] = creatorProjects.map((project) => ({
    ageDays: 0,
    author: {
      avatarUrl: creator.avatarUrl,
      headline: creator.headline,
      name: creator.name,
      pro: false,
    },
    primaryTag: project.tags[0] ?? "",
    id: project.id,
    image: getMediaDeliveryUrl(projectCoverUrl(project), { width: 800 }),
    likes: project.metrics.likes,
    source: project,
    tags: project.tags,
    title: project.title,
    views: project.metrics.views,
  }));

  const shareProfile = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(strings.profileLinkCopied);
    } catch {
      toast.error(window.location.href);
    }
  };

  const joined = formatDate(creator.joinAt, locale, "long");
  const metaItems = [
    creator.company ? { Icon: Briefcase, text: creator.company } : null,
    creator.location ? { Icon: MapPin, text: creator.location } : null,
    joined
      ? { Icon: CalendarBlank, text: strings.joinedOn.replace("{date}", joined) }
      : null,
  ].filter((item): item is { Icon: typeof Briefcase; text: string } =>
    Boolean(item),
  );

  return (
    <>
      {/* Header profil: cover dekoratif, avatar di tengah yang menimpa cover,
          info singkat di kiri, aksi di kanan, lalu strip tab. Tidak ada
          statistik — backend tidak punya data followers/statistik profil. */}
      <section className={`${PANEL_CLASS} overflow-hidden`}>
        <div className="relative h-36 m3-medium:h-52 m3-large:h-60">
          <Image
            alt=""
            className="object-cover"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1280px"
            src="/banner_card.png"
          />
        </div>

        <div className="grid gap-5 px-[var(--card-padding)] pb-6 m3-expanded:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] m3-expanded:items-end">
          <ul className="order-2 flex flex-wrap justify-center gap-x-5 gap-y-2 m3-expanded:order-1 m3-expanded:flex-col m3-expanded:items-start m3-expanded:pb-2">
            {metaItems.map(({ Icon, text }) => (
              <li
                className="flex min-w-0 items-center gap-2 type-label text-copy-secondary"
                key={text}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{text}</span>
              </li>
            ))}
          </ul>

          <div className="order-1 -mt-14 flex min-w-0 flex-col items-center text-center m3-medium:-mt-16 m3-expanded:order-2">
            <div className="rounded-full bg-gradient-to-br from-brand via-brand/60 to-chart-1 p-1">
              <ProjectAvatar
                avatarUrl={creator.avatarUrl}
                className="size-24 border-4 border-surface-raised m3-medium:size-28"
                name={creator.name}
              />
            </div>
            <h1 className="mt-3 max-w-full truncate type-card-title font-semibold">
              {creator.name}
            </h1>
            {creator.headline ? (
              <p className="mt-1 max-w-sm type-label text-copy-secondary">
                {creator.headline}
              </p>
            ) : null}
          </div>

          <div className="order-3 flex items-center justify-center gap-2 m3-expanded:justify-end m3-expanded:pb-2">
            {creator.websiteUrl ? (
              <a
                aria-label={strings.website}
                className="flex size-12 items-center justify-center rounded-full border border-border-subtle bg-surface-raised transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
                href={creator.websiteUrl}
                rel="noreferrer"
                target="_blank"
                title={creator.websiteUrl.replace(/^https?:\/\//i, "")}
              >
                <Globe className="size-5" />
              </a>
            ) : null}
            <Button
              className="h-12 rounded-full px-5"
              onClick={() => void shareProfile()}
            >
              <ShareNetwork className="size-4" weight="bold" />
              {strings.shareProfile}
            </Button>
          </div>
        </div>

        <div className="border-t border-border-subtle bg-surface-muted/40 px-[var(--card-padding)]">
          <Tabs
            onValueChange={(value) => setTab(value as ProfileTab)}
            value={tab}
          >
            <TabsList
              className="h-14! w-full justify-center gap-2 m3-expanded:justify-end"
              variant="line"
            >
              <TabsTrigger className="flex-none gap-2 px-3" value="projects">
                <FolderSimple className="size-4" />
                {strings.profileTabs.projects}
              </TabsTrigger>
              <TabsTrigger className="flex-none gap-2 px-3" value="about">
                <UserCircle className="size-4" />
                {strings.profileTabs.about}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      <div className="mt-[var(--grid-gap)]">
        {tab === "projects" ? (
          cards.length ? (
            // Grid selebar penuh dengan ukuran kartu yang sama seperti Explore.
            <div className="grid min-w-0 grid-cols-1 gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-expanded:grid-cols-3 m3-large:grid-cols-4">
              {cards.map((project) => (
                <ProjectCard
                  interactive={false}
                  key={project.id}
                  likeAria={strings.like}
                  onOpen={() =>
                    router.push(
                      `/explore?project=${encodeURIComponent(project.id)}`,
                    )
                  }
                  project={project}
                />
              ))}
            </div>
          ) : (
            <p
              className={`${PANEL_CLASS} px-6 py-16 text-center type-body text-copy-secondary`}
            >
              {strings.noCreatorProjects}
            </p>
          )
        ) : (
          <div className="grid items-start gap-[var(--grid-gap)] m3-large:grid-cols-2">
            <section className={`${PANEL_CLASS} p-[var(--card-padding)]`}>
              <h2 className="type-card-title font-semibold">
                {creator.aboutTitle || strings.introduction}
              </h2>
              <p className="mt-2 whitespace-pre-wrap type-label text-copy-secondary">
                {creator.aboutDescription || strings.noIntroduction}
              </p>
            </section>

            <section className={`${PANEL_CLASS} p-[var(--card-padding)]`}>
              <h2 className="type-card-title font-semibold">
                {strings.experience}
              </h2>
              {creator.workExperience.length ? (
                <ol className="mt-4 space-y-5">
                  {creator.workExperience.map((experience, index) => {
                    const start = formatDate(experience.startDate, locale, "short");
                    const end = experience.isCurrent
                      ? strings.present
                      : formatDate(experience.endDate, locale, "short");
                    return (
                      <li
                        className="flex gap-4"
                        key={`${experience.company}-${experience.title}-${index}`}
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-brand/10 text-brand">
                          <Briefcase className="size-5" weight="duotone" />
                        </span>
                        <div className="min-w-0">
                          <p className="type-label font-semibold">
                            {experience.title}
                          </p>
                          <p className="type-label text-copy-secondary">
                            {experience.company}
                          </p>
                          {start || end ? (
                            <p className="mt-1 type-metadata text-copy-muted">
                              {[start, end].filter(Boolean).join(" – ")}
                            </p>
                          ) : null}
                          {experience.description ? (
                            <p className="mt-2 whitespace-pre-wrap type-label text-copy-secondary">
                              {experience.description}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="mt-2 type-label text-copy-secondary">
                  {strings.noExperience}
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
}
