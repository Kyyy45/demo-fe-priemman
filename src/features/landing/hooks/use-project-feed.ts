"use client";

import { useEffect, useState } from "react";

import { projectService } from "@/shared/api/project";
import type { Project } from "@/shared/lib/types/project";

/** Memuat proyek Explore yang sudah dipublikasikan untuk presentation layer. */
export function useProjectFeed(limit?: number) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // 1. Explore selalu memakai cabang public backend. Dengan anonymous=true,
    // cookie creator tidak ikut terkirim sehingga backend memanggil ListPublic
    // (PUBLISHED + PUBLIC), bukan ListByOwner untuk session aktif.
    void projectService.list({ pageSize: limit ?? 50 }, true).then(
      (result) => {
        if (!active) return;
        setProjects(
          result.projects.filter(
            (item) =>
              item.status === "published" && item.visibility === "public",
          ),
        );
        setIsLoading(false);
      },
      () => {
        if (!active) return;
        setProjects([]);
        setIsLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [limit]);

  return { projects, setProjects, isLoading };
}
