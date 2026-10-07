"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { Project } from "@/shared/lib/types/explore";
import { sameTag } from "@/shared/lib/tags";

import { ProjectDetailBody } from "./project-detail/project-detail-body";
import {
  DiscussionPanel,
  ProjectDetailsModal,
  ShareProjectModal,
  type ShareCopyType,
} from "./project-detail/modals";

interface ProjectDetailOverlayProps {
  actionsDisabled?: boolean;
  project: Project | null;
  projects: Project[];
  liked: boolean;
  saved: boolean;
  onClose: () => void;
  onLike: () => void;
  onSave: () => void;
  onSelect: (project: Project) => void;
  ownerActions?: React.ReactNode;
}

export function ProjectDetailOverlay({
  actionsDisabled = false,
  project,
  projects,
  liked,
  saved,
  onClose,
  onLike,
  onSave,
  onSelect,
  ownerActions,
}: ProjectDetailOverlayProps) {
  // Menyimpan panel dan modal yang sedang dibuka
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState<ShareCopyType | null>(null);
  const [compactActions, setCompactActions] = useState(false);

  // Project terkait tetap dibuka di overlay yang sama, tetapi harus terasa
  // seperti membuka halaman detail baru: mulai dari header dan tanpa panel lama.
  const selectRelatedProject = (nextProject: Project) => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setCompactActions(false);
    setDiscussionOpen(false);
    setDetailsOpen(false);
    setShareOpen(false);
    setCopied(null);
    onSelect(nextProject);
  };

  // Memilih tiga project lain dengan tag utama yang sama.
  const relatedProjects = useMemo(
    () =>
      project
        ? projects
            .filter(
              (item) =>
                item.id !== project.id &&
                sameTag(item.primaryTag, project.primaryTag),
            )
            .slice(0, 3)
        : [],
    [project, projects],
  );

  // Membuka modal share dengan status copy yang baru
  const openShareModal = () => {
    setCopied(null);
    setShareOpen(true);
  };

  // Menyalin link public project ke clipboard
  const copyShare = async (type: ShareCopyType) => {
    if (!project) return;

    const projectUrl = `${window.location.origin}/explore?project=${project.id}`;

    await navigator.clipboard
      ?.writeText(projectUrl)
      .then(() => setCopied(type))
      .catch(() => undefined);
  };

  // Detail berada di document flow; Escape tetap menutup detail tanpa
  // mengunci scrollbar browser utama.
  useEffect(() => {
    if (!project) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (shareOpen) setShareOpen(false);
      else if (detailsOpen) setDetailsOpen(false);
      else if (discussionOpen) setDiscussionOpen(false);
      else onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [detailsOpen, discussionOpen, onClose, project, shareOpen]);

  // Tombol aksi samping mengikuti scroll dokumen utama, bukan scrollbar overlay.
  useEffect(() => {
    const updateCompactActions = () => setCompactActions(window.scrollY > 180);
    updateCompactActions();
    window.addEventListener("scroll", updateCompactActions, { passive: true });
    return () => window.removeEventListener("scroll", updateCompactActions);
  }, []);

  return (
    <AnimatePresence>
      {project ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="project-detail-page min-h-dvh bg-surface text-copy"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <ProjectDetailBody
            actionsDisabled={actionsDisabled}
            compactActions={compactActions}
            discussionOpen={discussionOpen}
            liked={liked}
            onClose={onClose}
            onDetails={() => setDetailsOpen(true)}
            onDiscussion={() => setDiscussionOpen((isOpen) => !isOpen)}
            onLike={onLike}
            onSelect={selectRelatedProject}
            onShare={openShareModal}
            onToggleSaved={onSave}
            ownerActions={ownerActions}
            project={project}
            related={relatedProjects}
            saved={saved}
            key={project.id}
          />

          <AnimatePresence>
            {discussionOpen ? (
              <DiscussionPanel
                onClose={() => setDiscussionOpen(false)}
                onDetails={() => setDetailsOpen(true)}
              />
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {shareOpen ? (
              <ShareProjectModal
                copied={copied}
                onClose={() => setShareOpen(false)}
                onCopy={copyShare}
                project={project}
              />
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {detailsOpen ? (
              <ProjectDetailsModal
                onClose={() => setDetailsOpen(false)}
                project={project}
              />
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
