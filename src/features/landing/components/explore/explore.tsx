"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { gsap } from "@/shared/lib/gsap";
import { useT } from "@/shared/providers/language-provider";
import { FilterPalette } from "@/features/landing/components/explore/filter-palette";
import { type Project } from "@/shared/lib/types/explore";
import { type SortId } from "@/shared/lib/types/explore";
import type { Project as ApiProject } from "@/shared/lib/types/project";
import { ProjectDetailOverlay } from "@/shared/components/project-detail-overlay";
import { ProjectCard } from "@/shared/components/project-card";
import { PrimaryActionLink } from "@/features/landing/components/shared/primary-action-link";
import { Skeleton } from "@/shared/ui/skeleton";
import { projectService } from "@/shared/api/project";
import { loadPublicFeed } from "@/shared/api/public-feed";
import { toExploreProject } from "@/shared/api/mappers/explore-project";
import { useProjectFeed } from "@/features/landing/hooks/use-project-feed";
import { sameTag, uniqueTags } from "@/shared/lib/tags";
import { authService, projectActionService } from "@/shared/api";

// Waktu acuan untuk menghitung umur project
const PROJECT_AGE_REFERENCE = Date.now();

// Mengarahkan guest ke login lalu kembali ke halaman project yang sedang dibuka
function redirectGuestToLogin() {
  const nextPath = `${window.location.pathname}${window.location.search}`;
  window.location.replace(`/login?next=${encodeURIComponent(nextPath)}`);
}
type ExploreProps = {
  limit?: number;
  mode?: "dynamic" | "static";
  showSeeMore?: boolean;
};

type AuthenticationStatus = "checking" | "authenticated" | "guest";

export function Explore({
  limit,
  mode = "dynamic",
  showSeeMore = false,
}: ExploreProps) {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProjectId = searchParams.get("project");
  const sectionRef = useRef<HTMLElement>(null);
  const viewedProjectIdsRef = useRef(new Set<string>());

  // Menyimpan filter dan project yang sedang dipilih
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<SortId>("forYou");
  const [staticSelectedProject, setStaticSelectedProject] =
    useState<Project | null>(null);
  const {
    projects: apiProjects,
    setProjects: setApiProjects,
    isLoading,
  } = useProjectFeed(limit);
  const [authenticationStatus, setAuthenticationStatus] =
    useState<AuthenticationStatus>("checking");
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const pendingActionsRef = useRef(new Set<string>());

  // Mengambil detail sekaligus mencatat satu view selama halaman ini dibuka
  const loadProjectDetail = useCallback(
    (projectId: string) => {
      if (viewedProjectIdsRef.current.has(projectId)) return;
      viewedProjectIdsRef.current.add(projectId);
      // 2. Detail pada Explore juga public; jangan mengikatnya ke owner session.
      void projectService
        .get(projectId, true)
        .then((freshProject) => {
          // Detail backend dilayani dari cache tanpa invalidasi, jadi metrik
          // like/save/view-nya bisa jauh tertinggal. Metrik dari feed (dibaca
          // langsung dari database) dipertahankan agar angka tidak mundur.
          setApiProjects((current) =>
            current.map((item) =>
              item.id === freshProject.id
                ? { ...freshProject, metrics: item.metrics }
                : item,
            ),
          );
        })
        .catch(() => {
          viewedProjectIdsRef.current.delete(projectId);
        });
    },
    [setApiProjects],
  );

  // Memuat status like dan save dari akun yang sedang login
  useEffect(() => {
    if (mode !== "dynamic") return;
    let active = true;
    void authService
      .hasActiveSession()
      .then(async (hasSession) => {
        if (!active) return;
        setAuthenticationStatus(hasSession ? "authenticated" : "guest");
        if (!hasSession) {
          setLiked([]);
          setSaved([]);
          return;
        }

        const [likedResult, savedResult] = await Promise.allSettled([
          projectActionService.listLiked({ limit: 100 }),
          projectActionService.listSaved({ limit: 100 }),
        ]);
        if (!active) return;
        if (likedResult.status === "fulfilled") {
          setLiked(likedResult.value.map((item) => item.projectId));
        }
        if (savedResult.status === "fulfilled") {
          setSaved(savedResult.value.map((item) => item.projectId));
        }
      })
      .catch(() => {
        if (!active) return;
        setAuthenticationStatus("guest");
        setLiked([]);
        setSaved([]);
      });
    return () => {
      active = false;
    };
  }, [mode]);

  // Menjalankan animasi card saat section masuk ke viewport
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Animasi card hanya dibuat setelah DOM memiliki hasil proyek. Saat API kosong
    // atau gagal, GSAP tidak lagi menerima selector tanpa target.
    const fadeTargets = section.querySelectorAll("[data-explore-fade]");
    const cardTargets = section.querySelectorAll("[data-explore-card]");
    const gridTarget = section.querySelector("[data-explore-grid]");

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        if (fadeTargets.length) {
          gsap.fromTo(
            fadeTargets,
            { autoAlpha: 0, y: 28 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.1,
              ease: "power3.out",
              scrollTrigger: { trigger: section, start: "top 75%" },
            },
          );
        }

        if (cardTargets.length && gridTarget) {
          gsap.fromTo(
            cardTargets,
            { autoAlpha: 0, y: 24 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.05,
              ease: "power3.out",
              scrollTrigger: { trigger: gridTarget, start: "top 82%" },
            },
          );
        }
      }, section);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  // Mengubah response API menjadi data yang dipakai project card
  const projects = useMemo(() => {
    const list: Project[] = apiProjects
      .map((item) => toExploreProject(item, PROJECT_AGE_REFERENCE))
      .filter((item) => !tag || item.tags.some((value) => sameTag(value, tag)));
    list.sort((left, right) =>
      sort === "latest"
        ? left.ageDays - right.ageDays
        : right.likes - left.likes || right.views - left.views,
    );
    return limit ? list.slice(0, limit) : list;
  }, [apiProjects, tag, sort, limit]);

  const availableTags = useMemo(
    () => uniqueTags(apiProjects.map((project) => project.tags)),
    [apiProjects],
  );

  // Menunggu pemeriksaan session selesai agar pengguna login tidak dianggap guest
  const requireAuthentication = useCallback(async () => {
    if (authenticationStatus === "authenticated") return true;

    if (authenticationStatus === "checking") {
      const hasSession = await authService.hasActiveSession();
      setAuthenticationStatus(hasSession ? "authenticated" : "guest");
      if (hasSession) return true;
    }

    redirectGuestToLogin();
    return false;
  }, [authenticationStatus]);

  // Menambah atau menghapus project dari daftar likes
  const toggleLike = async (id: string) => {
    if (!(await requireAuthentication())) return;

    const pendingKey = `like:${id}`;
    if (pendingActionsRef.current.has(pendingKey)) return;
    pendingActionsRef.current.add(pendingKey);

    const wasLiked = liked.includes(id);
    const next = wasLiked
      ? liked.filter((value) => value !== id)
      : [...liked, id];
    setLiked(next);
    adjustMetric(id, "likes", wasLiked ? -1 : 1);
    try {
      await (wasLiked
        ? projectActionService.unlike(id)
        : projectActionService.like(id));
    } catch {
      setLiked((current) =>
        wasLiked
          ? current.includes(id)
            ? current
            : [...current, id]
          : current.filter((value) => value !== id),
      );
      adjustMetric(id, "likes", wasLiked ? 1 : -1);
    } finally {
      pendingActionsRef.current.delete(pendingKey);
    }
  };

  // Menambah atau menghapus project dari daftar save
  const toggleSave = async (id: string) => {
    if (!(await requireAuthentication())) return;

    const pendingKey = `save:${id}`;
    if (pendingActionsRef.current.has(pendingKey)) return;
    pendingActionsRef.current.add(pendingKey);

    const wasSaved = saved.includes(id);
    const next = wasSaved
      ? saved.filter((value) => value !== id)
      : [...saved, id];
    setSaved(next);
    adjustMetric(id, "saves", wasSaved ? -1 : 1);
    try {
      await (wasSaved
        ? projectActionService.unsave(id)
        : projectActionService.save(id));
    } catch {
      setSaved((current) =>
        wasSaved
          ? current.includes(id)
            ? current
            : [...current, id]
          : current.filter((value) => value !== id),
      );
      adjustMetric(id, "saves", wasSaved ? 1 : -1);
    } finally {
      pendingActionsRef.current.delete(pendingKey);
    }
  };

  // Pada Explore dinamis, query adalah sumber kebenaran. Dengan begitu pergantian
  // URL langsung mengganti isi halaman tanpa menunggu state effect tersinkronkan.
  const feedProject =
    mode === "dynamic" && selectedProjectId
      ? (projects.find((project) => project.id === selectedProjectId) ?? null)
      : null;

  // `?project=` di luar feed (lebih lama dari 50 terbaru, atau draf/unlisted
  // milik sendiri yang dibuka dari Creator Studio) dimuat langsung dari API.
  // Sesi ikut terkirim: backend mengizinkan pemilik melihat proyek non-publik,
  // sedangkan pengunjung lain tetap hanya bisa membuka PUBLISHED + PUBLIC.
  const [directProject, setDirectProject] = useState<{
    id: string;
    project: Project | null;
  } | null>(null);
  useEffect(() => {
    if (mode !== "dynamic" || !selectedProjectId || isLoading || feedProject)
      return;
    let active = true;
    // Metrik detail dari backend dilayani dari cache yang tidak pernah
    // diperbarui; bila proyek ada di feed publik yang lebih panjang, angka
    // like/save/view diambil dari sana.
    Promise.all([
      projectService.get(selectedProjectId),
      loadPublicFeed().catch(() => []),
    ]).then(
      ([project, feed]) => {
        const listed = feed.find((item) => item.id === project.id);
        if (active)
          setDirectProject({
            id: selectedProjectId,
            project: toExploreProject(
              listed ? { ...project, metrics: listed.metrics } : project,
              PROJECT_AGE_REFERENCE,
            ),
          });
      },
      () => {
        if (active) setDirectProject({ id: selectedProjectId, project: null });
      },
    );
    return () => {
      active = false;
    };
  }, [feedProject, isLoading, mode, selectedProjectId]);

  const selectedProject =
    mode === "dynamic"
      ? (feedProject ??
        (directProject && directProject.id === selectedProjectId
          ? directProject.project
          : null))
      : staticSelectedProject;

  // Memperbarui angka like/save secara optimis, baik untuk project di feed
  // maupun project yang dimuat langsung lewat `?project=` di luar feed.
  function adjustMetric(id: string, key: "likes" | "saves", delta: number) {
    const bump = (project: ApiProject): ApiProject => ({
      ...project,
      metrics: {
        ...project.metrics,
        [key]: Math.max(0, project.metrics[key] + delta),
      },
    });
    setApiProjects((items) =>
      items.map((project) => (project.id === id ? bump(project) : project)),
    );
    setDirectProject((current) =>
      current?.project?.source && current.project.id === id
        ? {
            ...current,
            project: toExploreProject(
              bump(current.project.source),
              PROJECT_AGE_REFERENCE,
            ),
          }
        : current,
    );
  }

  // Memuat detail segar sekaligus mencatat view untuk project dari feed
  // (project yang dimuat langsung di atas sudah merupakan data segar).
  useEffect(() => {
    if (feedProject) loadProjectDetail(feedProject.id);
  }, [feedProject, loadProjectDetail]);
  useEffect(() => {
    if (mode === "static" && staticSelectedProject)
      loadProjectDetail(staticSelectedProject.id);
  }, [loadProjectDetail, mode, staticSelectedProject]);

  // Membuka detail project dan menyimpan ID-nya ke URL
  const openProject = (project: Project) => {
    if (mode === "dynamic") {
      router.push(`/explore?project=${encodeURIComponent(project.id)}`);
      return;
    }

    setStaticSelectedProject(project);
  };

  // Menutup detail project dan membersihkan ID dari URL
  const closeProject = () => {
    if (mode !== "dynamic") {
      setStaticSelectedProject(null);
      return;
    }
    router.replace("/explore");
  };

  const projectDetail = (
    <ProjectDetailOverlay
      liked={selectedProject ? liked.includes(selectedProject.id) : false}
      saved={selectedProject ? saved.includes(selectedProject.id) : false}
      onClose={closeProject}
      onLike={() => {
        if (selectedProject) void toggleLike(selectedProject.id);
      }}
      onSave={() => {
        if (selectedProject) void toggleSave(selectedProject.id);
      }}
      onSelect={openProject}
      project={selectedProject}
      projects={projects}
    />
  );

  // Detail dirender dalam document flow agar scrollbar browser utama
  // menjadi satu-satunya kontrol scroll project yang dipilih.
  if (selectedProject) return projectDetail;

  return (
    <section
      ref={sectionRef}
      id="explore"
      className="container-site min-w-0 py-[var(--landing-section-gap)]"
    >
      <div className="min-w-0 max-w-2xl">
        <h2 data-explore-fade className="type-section-title font-heading">
          {t.explore.title}
        </h2>
        <p data-explore-fade className="type-body mt-5">
          {t.explore.subtitle}
        </p>
      </div>

      <div data-explore-fade className="mt-10">
        <FilterPalette
          tags={availableTags}
          tag={tag}
          sort={sort}
          onTag={setTag}
          onSort={setSort}
          onClear={() => {
            setTag(null);
            setSort("forYou");
          }}
        />
      </div>

      <div
        data-explore-grid
        className="mt-12 grid min-w-0 grid-cols-1 gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-expanded:grid-cols-3 m3-large:grid-cols-4"
      >
        {isLoading
          ? Array.from(
              { length: limit ? Math.min(limit, 4) : 4 },
              (_, index) => <ProjectCardSkeleton key={index} />,
            )
          : projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                liked={liked.includes(project.id)}
                interactive={mode === "dynamic"}
                onLike={() => void toggleLike(project.id)}
                onOpen={() => openProject(project)}
                likeAria={t.explore.likeAria}
              />
            ))}
      </div>

      {showSeeMore ? (
        <div className="mt-14 flex justify-center">
          <PrimaryActionLink href="/explore">
            {t.explore.seeMore}
          </PrimaryActionLink>
        </div>
      ) : null}
    </section>
  );
}

function ProjectCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-[var(--radius-feature)] border border-border-subtle bg-surface-raised"
    >
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-5 p-[var(--card-padding)]">
        <Skeleton className="h-6 w-3/4" />
        <div className="flex items-center gap-3 border-t border-border-subtle pt-4">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}
