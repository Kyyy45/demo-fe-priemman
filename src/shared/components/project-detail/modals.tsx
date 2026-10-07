import {
  Check,
  FacebookLogo,
  Info,
  LinkSimple,
  LinkedinLogo,
  PinterestLogo,
  X,
  XLogo,
} from "@phosphor-icons/react";
import { motion } from "motion/react";

import { useT } from "@/shared/providers/language-provider";
import type { Project } from "@/shared/lib/types/explore";

import {
  ProjectAvatar,
  ProjectIconButton,
  ProjectModal,
  formatProjectCount,
  formatProjectLabel,
  formatProjectText,
} from "./primitives";

// Tiga overlay yang dibuka dari project detail (diskusi, detail metrik, dan
// share) digabung di sini — masing-masing kecil dan selalu dipakai berdampingan
// dari project-detail-overlay.tsx.

interface DiscussionPanelProps {
  onClose: () => void;
  onDetails: () => void;
}

export function DiscussionPanel({ onClose, onDetails }: DiscussionPanelProps) {
  const t = useT();
  const strings = t.projectDetail;
  const comments = strings.commentItems;

  return (
    <motion.aside
      animate={{ x: 0 }}
      className="fixed inset-y-0 right-0 z-[125] w-[calc(100%_-_22px)] max-w-[430px] overflow-visible border-l border-border-subtle bg-surface text-copy shadow-[var(--shadow-panel)]"
      exit={{ x: "100%" }}
      initial={{ x: "100%" }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        aria-label={strings.closeDiscussion}
        className="absolute -left-6 top-5 z-20 flex size-12 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
        onClick={onClose}
        type="button"
      >
        <span className="flex size-[26px] items-center justify-center rounded-full border border-border-subtle bg-surface text-copy-secondary transition hover:border-border-strong hover:text-copy">
          <X className="size-2.5" />
        </span>
      </button>

      <div className="h-full overflow-x-hidden overflow-y-auto">
        {/* Discussion Header */}
        <div className="sticky top-0 z-10 h-[84px] bg-surface">
          <div className="relative h-full">
            <div className="absolute right-[52px] top-[29px]">
              <ProjectIconButton label={strings.details} onClick={onDetails} size="size-[34px]">
                <Info className="size-[15px]" />
              </ProjectIconButton>
            </div>
          </div>
        </div>

        <div className="min-w-0 px-[52px] pb-12 pt-[50px]">
          {/* Discussion Intro */}
          <div className="text-center">
            <div className="relative mx-auto flex w-fit justify-center -space-x-2">
              <span className="m3-body-medium absolute -left-6 top-1 text-chart-3">✦</span>
              {comments.slice(0, 3).map(({ name }) => (
                <ProjectAvatar className="size-8 ring-[3px] ring-surface" key={name} name={name} />
              ))}
              <span className="m3-body-medium absolute -right-6 -top-2 text-chart-3">✦</span>
            </div>
            <h2 className="m3-title-large mt-5">{strings.joinDiscussion}</h2>
            <p className="m3-body-medium mx-auto mt-3 max-w-[290px] text-copy-secondary">
              {strings.discussionDescription}
            </p>
            <button
              className="m3-label-large mt-4 rounded-full bg-heading px-7 py-3 text-canvas hover:bg-brand hover:text-on-brand"
              type="button"
            >
              {strings.signUp}
            </button>
          </div>

          {/* Comment List */}
          <div className="mt-10 border-t border-border-subtle pt-9">
            <div className="space-y-8">
              {comments.map(({ name, body, time }) => (
                <div className="flex gap-3" key={name}>
                  <ProjectAvatar className="size-8" name={name} />
                  <div className="min-w-0">
                    <p className="m3-label-large">{name}</p>
                    <p className="m3-body-medium mt-1 text-copy-secondary">{body}</p>
                    <p className="m3-label-medium mt-1 text-copy-secondary/75">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

interface ProjectDetailsModalProps {
  onClose: () => void;
  project: Project;
}

export function ProjectDetailsModal({ onClose, project }: ProjectDetailsModalProps) {
  const t = useT();
  const strings = t.projectDetail;
  const metrics = [
    [strings.views, formatProjectCount(project.views)],
    [strings.likes, formatProjectCount(project.likes)],
    [strings.save, formatProjectCount(project.source?.metrics.saves ?? 0)],
  ];

  return (
    <ProjectModal closeLabel={strings.closeDialog} onClose={onClose}>
      <h2 className="m3-title-large">{strings.details}</h2>
      <p className="m3-body-small mt-2 text-copy-secondary">
        {formatProjectText(strings.published, { days: project.ageDays })}
      </p>

      {/* Project Metrics */}
      <div className="mt-8 grid min-w-0 grid-cols-3 gap-6 border-y py-6">
        {metrics.map(([label, value]) => (
          <div className="min-w-0" key={label}>
            <p className="m3-label-medium text-copy-secondary">{label}</p>
            <p className="m3-headline-small mt-2">{value}</p>
          </div>
        ))}
      </div>

      {/* Project Tags */}
      <p className="m3-label-large mt-7">{strings.tags}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span className="m3-label-medium rounded-full bg-surface-muted px-3 py-2" key={tag}>
            {formatProjectLabel(tag)}
          </span>
        ))}
      </div>
    </ProjectModal>
  );
}

export type ShareCopyType = "link";

interface ShareProjectModalProps {
  copied: ShareCopyType | null;
  onClose: () => void;
  onCopy: (type: ShareCopyType) => void;
  project: Project;
}

export function ShareProjectModal({ copied, onClose, onCopy, project }: ShareProjectModalProps) {
  const t = useT();
  const strings = t.projectDetail;

  // Membuat URL public untuk project yang sedang dibuka
  const projectUrl = typeof window === "undefined"
    ? ""
    : `${window.location.origin}/explore?project=${project.id}`;

  const socials = [
    ["LinkedIn", LinkedinLogo, `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(projectUrl)}`],
    ["Facebook", FacebookLogo, `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(projectUrl)}`],
    ["Pinterest", PinterestLogo, `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(projectUrl)}`],
    ["X", XLogo, `https://twitter.com/intent/tweet?url=${encodeURIComponent(projectUrl)}&text=${encodeURIComponent(project.title)}`],
  ] as const;

  return (
    <ProjectModal closeLabel={strings.closeDialog} onClose={onClose}>
      {/* Share Header */}
      <div className="text-center">
        <h2 className="m3-title-large">{strings.shareTitle}</h2>
        <p className="m3-body-medium mt-3 text-copy-secondary">{strings.shareDescription}</p>
      </div>

      {/* Project Preview */}
      <div className="relative mt-8 overflow-hidden rounded-[var(--radius-card)] bg-heading">
        <img
          alt={project.title}
          className="aspect-[16/10] w-full object-cover"
          src={project.image}
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-action-ink/90 via-action-ink/55 to-transparent px-5 pb-5 pt-16 text-left text-on-dark">
          <div className="flex min-w-0 items-center gap-3">
            <ProjectAvatar
              avatarUrl={project.author.avatarUrl}
              className="size-10 ring-2 ring-on-dark/50"
              name={project.author.name}
            />
            <div className="min-w-0">
              <p className="m3-label-large truncate">{project.title}</p>
              <p className="m3-label-medium mt-0.5 text-on-dark/75">{project.author.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="mt-8 flex items-center justify-center gap-4">
        {socials.map(([name, Icon, href]) => (
          <a
            aria-label={formatProjectText(strings.shareTo, { name })}
            className="flex size-12 items-center justify-center rounded-full border border-border-subtle text-copy transition hover:border-border-strong hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
            href={href}
            key={name}
            rel="noreferrer"
            target="_blank"
          >
            <Icon className="size-5" weight="fill" />
          </a>
        ))}
      </div>

      {/* Copy Actions */}
      <div className="mt-8">
        <button
          className="m3-label-large flex h-12 w-full items-center justify-center gap-2 rounded-full bg-heading text-canvas transition-colors hover:bg-brand hover:text-on-brand"
          onClick={() => onCopy("link")}
          type="button"
        >
          {copied === "link" ? <Check className="size-4" weight="bold" /> : <LinkSimple className="size-4" weight="bold" />}
          {copied === "link" ? strings.linkCopied : strings.copyLink}
        </button>
      </div>
    </ProjectModal>
  );
}
