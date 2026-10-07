"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Bookmark,
  Eye,
  Heart,
  Pencil,
  Trash2,
} from "lucide-react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useLanguage } from "@/shared/providers/language-provider";
import { cn } from "@/shared/lib/utils";
import { CreateProjectWizard } from "@/features/dashboard-creator/components/creator-studio/create";
import { ProjectDetailOverlay as ExploreProjectDetailOverlay } from "@/shared/components/project-detail-overlay";
import type { Project as ExploreProject } from "@/shared/lib/types/explore";
import { toast } from "sonner";
import {
  isProjectOwnedBy,
  projectInputFromProject,
  projectService,
  userService,
} from "@/shared/api";
import { creatorStudioErrorMessage } from "./api-errors";
import { DashboardBanner } from "@/shared/layout/dashboard/dashboard-banner";
import type { Project as ApiProject } from "@/shared/lib/types/project";
import {
  CutoutCard,
  CutoutCardAction,
  CutoutCardContent,
  CutoutCardFooter,
  CutoutCardImage,
  CutoutCardInsetLabel,
  CutoutCardMedia,
  CutoutCardOverlay,
  CutoutCardPin,
  CutoutCorner,
  cutoutCardSurfaceClassName,
} from "@/shared/ui/cutout-card";

// Mengikuti enum ProjectStatus di project.proto (tanpa UNSPECIFIED).
type ProjectStatus = "published" | "draft" | "archived";

type StudioProject = {
  id: string;
  title: string;
  owner: string;
  role: string;
  status: ProjectStatus;
  postedAt: string;
  description: string;
  cover: string;
  media: string[];
  tools: string[];
  disciplines: string[];
  tags: string[];
  // ProjectMetrics di proto hanya views, likes, saves.
  metrics: {
    views: string;
    likes: string;
    saves: string;
  };
  source: ApiProject;
};

// Mengambil ringkasan teks dari content project
function contentSummary(content: string) {
  if (!content) return "";
  try {
    const parsed = JSON.parse(content) as {
      summary?: unknown;
      description?: unknown;
      text?: unknown;
    };
    if (typeof parsed.summary === "string") return parsed.summary;
    if (typeof parsed.description === "string") return parsed.description;
    if (typeof parsed.text === "string") return parsed.text;
  } catch {
    return content;
  }
  return content;
}

// Menyingkat angka metric yang besar
function formatMetric(value: number) {
  return new Intl.NumberFormat(undefined, {
    notation: value >= 1000 ? "compact" : "standard",
  }).format(value);
}

// Mengubah response API menjadi data yang dipakai Creator Studio
function toStudioProject(
  project: ApiProject,
  owner: string,
  role: string,
  locale: string,
  notPublished: string,
): StudioProject {
  const orderedMedia = [...project.media].sort(
    (left, right) => left.order - right.order,
  );
  const cover =
    orderedMedia.find((item) => item.id === project.coverMediaId)?.url ??
    orderedMedia[0]?.url ??
    "";
  const date = project.publishedAt || project.updatedAt || project.createdAt;

  return {
    id: project.id,
    title: project.title,
    owner,
    role: role || project.tags.slice(0, 3).join(", ") || "Creator",
    status:
      project.status === "published" || project.status === "archived"
        ? project.status
        : "draft",
    postedAt: date
      ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
          new Date(date),
        )
      : notPublished,
    description: contentSummary(project.content),
    cover,
    media: orderedMedia.map((item) => item.url),
    tools: [],
    disciplines: project.tags,
    tags: project.tags,
    metrics: {
      views: formatMetric(project.metrics.views),
      likes: formatMetric(project.metrics.likes),
      saves: formatMetric(project.metrics.saves),
    },
    source: project,
  };
}

// Mengubah project Creator Studio menjadi project untuk overlay public
function toExploreProject(project: StudioProject): ExploreProject {
  const publishedAt = project.source.publishedAt
    ? new Date(project.source.publishedAt).getTime()
    : Date.now();

  return {
    id: project.id,
    title: project.title,
    primaryTag: project.tags[0] ?? "",
    tags: project.tags,
    author: {
      name: project.owner,
      avatarUrl: project.source.author?.avatarUrl || undefined,
      headline: project.source.author?.headline || undefined,
      pro: false,
    },
    likes: project.source.metrics.likes,
    views: project.source.metrics.views,
    ageDays: Math.max(0, Math.floor((Date.now() - publishedAt) / 86400000)),
    image: project.cover,
    source: project.source,
  };
}

function ProjectCard({
  project,
  onOpen,
  statusLabel,
}: {
  project: StudioProject;
  onOpen: (project: StudioProject) => void;
  statusLabel: string;
}) {
  return (
    <button
      className="block h-full w-full rounded-[var(--radius-feature)] text-left outline-none focus-visible:ring-3 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      onClick={() => onOpen(project)}
      type="button"
    >
      <CutoutCard
        className={cn("group flex h-full flex-col", cutoutCardSurfaceClassName)}
      >
        <CutoutCardMedia className="aspect-[4/3]">
          {project.cover ? (
            <CutoutCardImage
              alt={`${project.title} cover`}
              src={project.cover}
            />
          ) : (
            <div
              aria-label={`${project.title} cover placeholder`}
              className="h-full w-full bg-surface-container-high"
              role="img"
            />
          )}
          <CutoutCardOverlay />
          <CutoutCardInsetLabel className="bottom-0 left-0 rounded-tr-[20px] bg-surface-container px-4 py-2">
            <span className="m3-label-small uppercase text-copy-muted">
              {statusLabel}
            </span>
            <CutoutCorner className="absolute -right-[31px] -bottom-px rotate-90 text-surface-container" />
            <CutoutCorner className="absolute -top-[31px] -left-px rotate-90 text-surface-container" />
          </CutoutCardInsetLabel>

          <CutoutCardPin className="top-0 right-0 rounded-bl-[20px] bg-surface-container p-1.5">
            <CutoutCardAction
              revealOnHover={false}
              className="relative static transform-none opacity-100"
            >
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-full bg-action-ink text-on-dark shadow-[var(--shadow-control)]"
              >
                <ArrowUpRight
                  className="icon-motion-arrow-up-right size-4"
                  weight="bold"
                />
              </span>
            </CutoutCardAction>
            <CutoutCorner
              className="absolute top-0 -left-[31px] -rotate-90 text-surface-container"
              size={32}
            />
            <CutoutCorner
              className="absolute right-0 -bottom-[31px] -rotate-90 text-surface-container"
              size={32}
            />
          </CutoutCardPin>
        </CutoutCardMedia>

        <CutoutCardContent className="flex flex-1 flex-col p-[var(--card-padding)]">
          <h4 className="mb-1 line-clamp-1 type-card-title font-medium leading-snug text-copy">
            {project.title}
          </h4>
          <p className="line-clamp-1 type-label text-copy-secondary">
            {project.role}
          </p>

          {project.status === "published" ? (
            <CutoutCardFooter className="mt-auto border-t border-border-subtle/80 pt-[var(--grid-gap)]">
              <div className="flex items-center gap-3 type-metadata text-copy-muted">
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" /> {project.metrics.views}
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4" /> {project.metrics.likes}
                </span>
                <span className="flex items-center gap-1.5">
                  <Bookmark className="h-4 w-4" /> {project.metrics.saves}
                </span>
              </div>
            </CutoutCardFooter>
          ) : null}
        </CutoutCardContent>
      </CutoutCard>
    </button>
  );
}

export function CreatorStudio() {
  const { lang, t } = useLanguage();
  const s = t.dashboardCreator.creatorStudio;
  const locale = lang === "id" ? "id-ID" : "en-US";

  // Menyimpan daftar project dan project yang sedang diproses
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<StudioProject | null>(
    null,
  );
  const [editProject, setEditProject] = useState<ApiProject | null>(null);
  const [ownerName, setOwnerName] = useState("Creator");
  const [ownerRole, setOwnerRole] = useState("Creator");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [projectPendingDelete, setProjectPendingDelete] =
    useState<StudioProject | null>(null);

  // Memuat project dan profile creator secara bersamaan
  useEffect(() => {
    let active = true;
    void Promise.all([projectService.listOwned(), userService.getMe()])
      .then(([ownedResult, user]) => {
        if (!active) return;
        const name =
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          user.email ||
          "Creator";
        const role = user.headline || user.company || "Creator";
        setOwnerName(name);
        setOwnerRole(role);
        const ownedProjects = ownedResult.filter((project) =>
          isProjectOwnedBy(project, user.id),
        );
        setProjects(
          ownedProjects.map((project) =>
            toStudioProject(project, name, role, locale, s.status.notPublished),
          ),
        );
      })
      .catch((error) => {
        if (active)
          toast.error(
            creatorStudioErrorMessage(error, s.errors, s.feedback.loadError),
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [locale, s.errors, s.feedback.loadError, s.status.notPublished]);

  // Menyinkronkan project aktif dengan query parameter
  useEffect(() => {
    const synchronizeSelectedProject = () => {
      const projectId = new URL(window.location.href).searchParams.get(
        "project",
      );
      setSelectedProject(
        projectId
          ? (projects.find((project) => project.id === projectId) ?? null)
          : null,
      );
    };

    synchronizeSelectedProject();
    window.addEventListener("popstate", synchronizeSelectedProject);
    return () =>
      window.removeEventListener("popstate", synchronizeSelectedProject);
  }, [projects]);

  // Menyimpan project aktif ke URL tanpa reload halaman
  const updateProjectUrl = (
    projectId: string | null,
    method: "pushState" | "replaceState" = "pushState",
  ) => {
    const url = new URL(window.location.href);
    if (projectId) url.searchParams.set("project", projectId);
    else url.searchParams.delete("project");
    window.history[method]({}, "", url);
  };

  const closeProject = () => {
    setSelectedProject(null);
    updateProjectUrl(null, "replaceState");
  };

  // Mengelompokkan project berdasarkan status tab
  const projectGroups = useMemo(
    () => ({
      all: projects,
      drafts: projects.filter((project) => project.status === "draft"),
      published: projects.filter((project) => project.status === "published"),
      archived: projects.filter((project) => project.status === "archived"),
    }),
    [projects],
  );

  // Label kartu: status proto, plus visibility untuk project published yang
  // UNLISTED (tidak tampil di feed walau sudah dipublikasikan).
  const statusLabel = (project: StudioProject) =>
    project.status === "published" &&
    project.source.visibility === "unlisted"
      ? `${s.status.published} · ${s.status.unlisted}`
      : s.status[project.status];

  // Memasukkan hasil save terbaru ke daftar project
  const saveProject = (saved: ApiProject) => {
    const mapped = toStudioProject(
      saved,
      ownerName,
      ownerRole,
      locale,
      s.status.notPublished,
    );
    setProjects((items) => {
      const exists = items.some((item) => item.id === mapped.id);
      return exists
        ? items.map((item) => (item.id === mapped.id ? mapped : item))
        : [mapped, ...items];
    });
    setSelectedProject(mapped);
    updateProjectUrl(mapped.id, "replaceState");
    setEditProject(null);
  };

  // Membuka overlay lalu mengambil detail project terbaru
  const openProject = async (project: StudioProject) => {
    setSelectedProject(project);
    if (
      new URL(window.location.href).searchParams.get("project") !== project.id
    ) {
      updateProjectUrl(project.id);
    }
    try {
      const detail = await projectService.get(project.id);
      setSelectedProject(
        toStudioProject(
          detail,
          ownerName,
          ownerRole,
          locale,
          s.status.notPublished,
        ),
      );
    } catch (error) {
      toast.error(
        creatorStudioErrorMessage(error, s.errors, s.feedback.refreshError),
      );
    }
  };

  // Arsip/pulihkan = PUT dengan ProjectInput lengkap dan status baru.
  // Project yang dipulihkan kembali ke DRAFT (bukan langsung published).
  const changeStatus = async (
    project: StudioProject,
    status: Exclude<ProjectStatus, "published">,
  ) => {
    setChangingStatus(true);
    try {
      const saved = await projectService.update(
        project.id,
        projectInputFromProject(project.source, { status }),
      );
      const mapped = toStudioProject(
        saved,
        ownerName,
        ownerRole,
        locale,
        s.status.notPublished,
      );
      setProjects((items) =>
        items.map((item) => (item.id === mapped.id ? mapped : item)),
      );
      setSelectedProject(mapped);
      toast.success(
        status === "archived"
          ? s.feedback.archiveSuccess
          : s.feedback.restoreSuccess,
      );
    } catch (error) {
      toast.error(
        creatorStudioErrorMessage(error, s.errors, s.feedback.statusError),
      );
    } finally {
      setChangingStatus(false);
    }
  };

  // Menghapus project setelah dialog konfirmasi disetujui
  const deleteProject = async (project: StudioProject) => {
    setDeleting(true);
    try {
      await projectService.delete(project.id);
      setProjects((items) => items.filter((item) => item.id !== project.id));
      setProjectPendingDelete(null);
      closeProject();
      toast.success(s.feedback.deleteSuccess);
    } catch (error) {
      toast.error(
        creatorStudioErrorMessage(error, s.errors, s.feedback.deleteError),
      );
    } finally {
      setDeleting(false);
    }
  };

  // Membuat isi grid untuk loading, empty state, atau daftar project
  const projectGrid = (items: StudioProject[]) => {
    if (loading) {
      return Array.from({ length: 3 }, (_, index) => (
        <div
          aria-hidden="true"
          className="overflow-hidden rounded-[var(--radius-feature)] bg-surface-container-low"
          key={index}
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-4 p-[var(--card-padding)]">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/5" />
          </div>
        </div>
      ));
    }
    if (!items.length) {
      return (
        <div className="col-span-full rounded-[var(--radius-control)] border border-dashed p-[var(--card-padding)] text-center text-copy-secondary">
          {s.feedback.empty}
        </div>
      );
    }
    return items.map((project) => (
      <ProjectCard
        key={project.id}
        onOpen={(item) => void openProject(item)}
        project={project}
        statusLabel={statusLabel(project)}
      />
    ));
  };

  const deleteProjectDialog = (
    <Dialog
      open={Boolean(projectPendingDelete)}
      onOpenChange={(open) => {
        // Dialog ini controlled: selama deleting=true, projectPendingDelete tidak
        // pernah dikosongkan, jadi open tetap true apa pun pemicunya (escape,
        // klik di luar, atau tombol close) — delete tidak bisa dibatalkan di tengah jalan.
        if (!open && !deleting) setProjectPendingDelete(null);
      }}
    >
      <DialogContent
        aria-describedby="delete-project-description"
        className="max-w-md"
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex size-12 items-center justify-center rounded-full border border-danger/20 bg-danger/10 text-danger">
            <Trash2 aria-hidden="true" className="size-5" />
          </div>
          <DialogTitle>{s.deleteDialog.title}</DialogTitle>
          <DialogDescription id="delete-project-description">
            {s.deleteDialog.description.replace(
              "{title}",
              projectPendingDelete?.title ?? "",
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="m-0 rounded-none border-0 bg-transparent p-0">
          <Button
            className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
            disabled={deleting}
            onClick={() => setProjectPendingDelete(null)}
            variant="outline"
          >
            {s.deleteDialog.cancel}
          </Button>
          <Button
            className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
            disabled={deleting}
            onClick={() => {
              if (projectPendingDelete)
                void deleteProject(projectPendingDelete);
            }}
            variant="destructive"
          >
            {deleting ? s.deleteDialog.deleting : s.deleteDialog.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (selectedProject) {
    return (
      <>
        {deleteProjectDialog}
        <ExploreProjectDetailOverlay
          actionsDisabled
          liked={false}
          saved={false}
          onClose={closeProject}
          onLike={() => undefined}
          onSave={() => undefined}
          onSelect={(project) => {
            const studioProject = projects.find(
              (item) => item.id === project.id,
            );
            if (studioProject) void openProject(studioProject);
          }}
          ownerActions={
            <>
              <Button
                aria-label={s.actions.edit}
                onClick={() => {
                  setEditProject(selectedProject.source);
                  closeProject();
                }}
                size="icon"
                variant="outline"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                aria-label={
                  selectedProject.status === "archived"
                    ? s.actions.restore
                    : s.actions.archive
                }
                disabled={changingStatus || deleting}
                onClick={() =>
                  void changeStatus(
                    selectedProject,
                    selectedProject.status === "archived" ? "draft" : "archived",
                  )
                }
                size="icon"
                title={
                  selectedProject.status === "archived"
                    ? s.actions.restore
                    : s.actions.archive
                }
                variant="outline"
              >
                {selectedProject.status === "archived" ? (
                  <ArchiveRestore className="size-4" />
                ) : (
                  <Archive className="size-4" />
                )}
              </Button>
              <Button
                aria-label={s.actions.delete}
                disabled={changingStatus || deleting}
                onClick={() => setProjectPendingDelete(selectedProject)}
                size="icon"
                variant="outline"
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          }
          project={toExploreProject(selectedProject)}
          projects={projects.map(toExploreProject)}
        />
        <CreateProjectWizard
          onOpenChange={(open) => {
            if (!open) setEditProject(null);
          }}
          onSaved={saveProject}
          open={Boolean(editProject)}
          project={editProject}
        />
      </>
    );
  }

  return (
    // w-full min-w-0 overflow-x-clip — sama dengan wrapper ProjectLibrary.
    // pb-[var(--dashboard-content-padding)] SENGAJA tidak ditambahkan di sini:
    // <main> di DashboardLayout sudah menerapkannya ke semua halaman dashboard;
    // menambahkannya lagi di root halaman bikin padding bawah dobel.
    <div className="@container/creator-studio flex w-full min-w-0 flex-col gap-[var(--grid-gap)] overflow-x-clip">
      <DashboardBanner subtitle={s.subtitle} title={s.title} />
      {deleteProjectDialog}

      {/* Toolbar di bawah banner — rectangle TabsList dan tombol Create project
          disamakan tingginya (h-12) supaya sejajar sebagai satu baris aksi.
          Tabs secara default punya gap-2 bawaan (beda token dari --grid-gap
          yang dipakai di seluruh halaman lain) — di-override di sini supaya
          jarak antar baris (toolbar ke grid project) konsisten dengan Library,
          dan mb-[var(--card-padding)] di toolbar DIHAPUS supaya tidak menumpuk
          dengan gap ini (dua sumber jarak untuk satu celah yang sama). */}
      <Tabs defaultValue="all" className="w-full gap-[var(--grid-gap)]">
        <div className="flex flex-col gap-[var(--grid-gap)] m3-medium:flex-row m3-medium:items-center m3-medium:justify-between">
          {/* !h-12 (bukan h-12 polos) — TabsList punya class bawaan
              `group-data-horizontal/tabs:h-9` yang selector-nya lebih spesifik
              dari class h-12 polos, jadi h-9 bawaan tetap menang di cascade
              walau tailwind-merge tidak menganggapnya konflik (bentuk classnya
              beda: satu pakai variant prefix, satu polos). !important memaksa
              menang terlepas dari spesifisitas selector.
              overflow-y-hidden eksplisit — tanpa ini, overflow-x-auto sendirian
              membuat browser otomatis mempromosikan overflow-y jadi auto juga
              (aturan CSS: salah satu axis overflow non-visible memaksa axis
              lainnya ikut auto), memunculkan scrollbar vertikal yang tidak perlu. */}
          <TabsList className="h-12! max-w-full overflow-x-auto overflow-y-hidden">
            <TabsTrigger value="all">{s.tabs.all}</TabsTrigger>
            <TabsTrigger value="drafts">{s.tabs.drafts}</TabsTrigger>
            <TabsTrigger value="published">{s.tabs.published}</TabsTrigger>
            <TabsTrigger value="archived">{s.tabs.archived}</TabsTrigger>
          </TabsList>
          <CreateProjectWizard onSaved={saveProject} />
        </div>
        <TabsContent value="all" className="mt-0 outline-none">
          <div className="grid grid-cols-1 gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-extra-large:grid-cols-3">
            {projectGrid(projectGroups.all)}
          </div>
        </TabsContent>
        <TabsContent value="drafts" className="mt-0 outline-none">
          <div className="grid grid-cols-1 gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-extra-large:grid-cols-3">
            {projectGrid(projectGroups.drafts)}
          </div>
        </TabsContent>
        <TabsContent value="published" className="mt-0 outline-none">
          <div className="grid grid-cols-1 gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-extra-large:grid-cols-3">
            {projectGrid(projectGroups.published)}
          </div>
        </TabsContent>
        <TabsContent value="archived" className="mt-0 outline-none">
          <div className="grid grid-cols-1 gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-extra-large:grid-cols-3">
            {projectGrid(projectGroups.archived)}
          </div>
        </TabsContent>
      </Tabs>

      <CreateProjectWizard
        onOpenChange={(open) => {
          if (!open) setEditProject(null);
        }}
        onSaved={saveProject}
        open={Boolean(editProject)}
        project={editProject}
      />
    </div>
  );
}
