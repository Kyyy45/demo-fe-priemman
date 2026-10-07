"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { getErrorMessage, projectActionService } from "@/shared/api";
import type {
  ProjectAction,
  ProjectSummary,
} from "@/shared/lib/types/project-actions";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table01 } from "@/shared/ui/shadcn-space/table-01";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

// Contract backend menetapkan pagination awal liked/saved pada limit=10.
const PAGE_SIZE = 10;

type ProjectLibraryCopy = {
  likedTitle: string;
  savedTitle: string;
  likedDescription: string;
  savedDescription: string;
  emptyLiked: string;
  emptySaved: string;
  removeLike: string;
  removeSaved: string;
  previousPage: string;
  nextPage: string;
  show: string;
  showing: string;
  tableHeaders: { project: string; creator: string; action: string };
  loadFailed: string;
};

// 1. Library memakai endpoint User liked/saved; mode menentukan path serta aksi delete.
export function ProjectLibrary({
  mode,
  copy,
}: {
  mode: ProjectAction;
  copy: ProjectLibraryCopy;
}) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const title = mode === "liked" ? copy.likedTitle : copy.savedTitle;
  const description =
    mode === "liked" ? copy.likedDescription : copy.savedDescription;
  const emptyState = mode === "liked" ? copy.emptyLiked : copy.emptySaved;
  const removeLabel = mode === "liked" ? copy.removeLike : copy.removeSaved;

  // 2. Saat tab atau halaman pagination berubah, ambil satu halaman project dari backend.
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setLoading(true);
    });

    const request =
      mode === "liked"
        ? projectActionService.listLiked({ limit: PAGE_SIZE, offset })
        : projectActionService.listSaved({ limit: PAGE_SIZE, offset });

    request
      .then((result) => {
        if (active) {
          setProjects(result);
        }
      })
      .catch((error) => {
        if (active) {
          setProjects([]);
          toast.error(getErrorMessage(error, copy.loadFailed));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [copy.loadFailed, mode, offset]);

  // 3. Hapus relasi liked/saved, lalu hapus card lokal tanpa memuat ulang seluruh halaman.
  const removeProject = async (projectId: string) => {
    if (removingId) return;
    setRemovingId(projectId);

    try {
      if (mode === "liked") await projectActionService.unlike(projectId);
      else await projectActionService.unsave(projectId);
      setProjects((current) =>
        current.filter((project) => project.projectId !== projectId),
      );
    } catch (error) {
      toast.error(getErrorMessage(error, copy.loadFailed));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    // pb-[var(--dashboard-content-padding)] TIDAK ditambahkan di sini — <main>
    // di DashboardLayout sudah menerapkannya ke semua halaman dashboard.
    // Menambahkannya lagi di sini membuat Library dapat padding bawah dobel
    // dibanding halaman lain (Overview, Account, dst).
    <div className="@container/library flex w-full min-w-0 flex-col gap-[var(--grid-gap)] overflow-x-clip">
      {/* 4. Header menjelaskan daftar personal yang dibaca dari endpoint User. */}
      <header className="relative flex min-h-40 items-end overflow-hidden rounded-[var(--radius-card)] border border-brand/25 p-6 text-on-brand m3-medium:min-h-48">
        <Image
          alt=""
          className="object-cover"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1440px"
          src="/banner_card.png"
        />
        <div className="absolute inset-0 bg-heading/30 dark:bg-transparent" />
        <div className="relative min-w-0">
          <h1 className="dashboard-page-title !text-on-brand">{title}</h1>
          <p className="dashboard-body mt-3 !text-on-brand/75">{description}</p>
        </div>
      </header>

      {/* 5. Grid text-only menghindari URL thumbnail eksternal dan tetap aman pada layar sempit. */}
      {loading ? (
        <div
          className="grid grid-cols-1 gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-extra-large:grid-cols-3"
          aria-busy="true"
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              className="h-40 rounded-[var(--radius-card)] border border-border-subtle"
              key={index}
            />
          ))}
        </div>
      ) : projects.length ? (
        <Table01
          count={projects.length}
          hasNextPage={projects.length === PAGE_SIZE}
          labels={{
            next: copy.nextPage,
            previous: copy.previousPage,
            show: copy.show,
            showing: copy.showing,
          }}
          loading={loading}
          offset={offset}
          onNext={() => setOffset((current) => current + PAGE_SIZE)}
          onPageSizeChange={() => undefined}
          onPrevious={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
          pageSize={PAGE_SIZE}
        >
          <Table>
            <TableHeader className="bg-surface-container-high/70">
              <TableRow className="hover:bg-transparent">
                <TableHead className="dashboard-table-label h-12 px-4 first:pl-5">
                  {copy.tableHeaders.project}
                </TableHead>
                <TableHead className="dashboard-table-label h-12 px-4">
                  {copy.tableHeaders.creator}
                </TableHead>
                <TableHead className="dashboard-table-label h-12 px-4 last:pr-5 text-right">
                  {copy.tableHeaders.action}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
          {projects.map((project) => (
            <TableRow className="cursor-pointer hover:bg-surface-container" key={project.projectId} onClick={() => { window.location.href = `/explore?project=${encodeURIComponent(project.projectId)}`; }}>
              <TableCell className="dashboard-body px-4 py-4 pl-5 font-medium !text-copy">
                <div className="flex items-center gap-3">
                  {project.thumbnail ? (
                    <img alt="" className="size-10 rounded-[var(--radius-control)] object-cover" height={40} src={project.thumbnail} width={40} />
                  ) : (
                    <span className="grid size-10 place-items-center rounded-[var(--radius-control)] bg-brand/10 text-brand">P</span>
                  )}
                  <span className="font-medium">{project.title || "—"}</span>
                </div>
              </TableCell>
              <TableCell className="dashboard-body px-4 py-4 !text-copy">
                {[project.firstName, project.lastName]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </TableCell>
              <TableCell className="px-4 py-4 pr-5 text-right">
              <Button
                className="h-9 text-danger hover:bg-danger/10 hover:text-danger"
                disabled={removingId === project.projectId}
                onClick={(event) => {
                  event.stopPropagation();
                  removeProject(project.projectId);
                }}
                type="button"
                variant="ghost"
              >
                <Trash aria-hidden="true" className="size-4" />
                <span className="sr-only">{removeLabel}</span>
              </Button>
              </TableCell>
            </TableRow>
          ))}
            </TableBody>
          </Table>
        </Table01>
      ) : (
        <div className="dashboard-body rounded-[var(--radius-card)] bg-surface-container-low p-[var(--card-padding)] text-center">
          {emptyState}
        </div>
      )}

    </div>
  );
}
