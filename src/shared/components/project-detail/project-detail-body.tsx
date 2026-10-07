import type { ReactNode } from "react";
import { motion } from "motion/react";
import {
  BookmarkSimple,
  ChatCircle,
  Check,
  EnvelopeSimple,
  GithubLogo,
  Heart,
  Info,
  InstagramLogo,
  LinkedinLogo,
  ShareNetwork,
  X,
} from "@phosphor-icons/react";

import { ProjectContent } from "@/shared/components/project-content";
import { useT } from "@/shared/providers/language-provider";
import type { Project } from "@/shared/lib/types/explore";
import type { PublicCreatorProfile } from "@/shared/lib/types/public-creator-profile";
import { cn } from "@/shared/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import { ProjectAvatar, ProjectIconButton, formatProjectText } from "./primitives";
import { ProjectCard } from "../project-card";

interface ProjectDetailBodyProps {
  actionsDisabled?: boolean;
  compactActions: boolean;
  discussionOpen: boolean;
  liked: boolean;
  onClose: () => void;
  onDetails: () => void;
  onDiscussion: () => void;
  onLike: () => void;
  onSelect: (project: Project) => void;
  onShare: () => void;
  onToggleSaved: () => void;
  ownerActions?: ReactNode;
  project: Project;
  related: Project[];
  saved: boolean;
}

// Membaca social link yang dipilih creator saat project disimpan
function getProjectMetadata(project: Project) {
  const empty = {
    profile: null as PublicCreatorProfile | null,
    socialLinks: [] as Array<{
      platform: "instagram" | "linkedin" | "github";
      url: string;
      Icon: typeof InstagramLogo;
    }>,
  };
  if (!project.source?.content) return empty;
  try {
    const stored = JSON.parse(project.source.content) as {
      authorProfile?: PublicCreatorProfile;
      socialLinks?: Partial<
        Record<"instagram" | "linkedin" | "github", string>
      >;
    };
    const icons = {
      instagram: InstagramLogo,
      linkedin: LinkedinLogo,
      github: GithubLogo,
    };
    const socialLinks = (
      Object.entries(stored.socialLinks ?? {}) as Array<
        [keyof typeof icons, string]
      >
    )
      .filter(([, url]) => /^https:\/\//i.test(url))
      .map(([platform, url]) => ({ platform, url, Icon: icons[platform] }));
    return { profile: stored.authorProfile ?? null, socialLinks };
  } catch {
    return empty;
  }
}

export function ProjectDetailBody({
  actionsDisabled = false,
  compactActions,
  discussionOpen,
  liked,
  onClose,
  onDetails,
  onDiscussion,
  onLike,
  onSelect,
  onShare,
  onToggleSaved,
  ownerActions,
  project,
  related,
  saved,
}: ProjectDetailBodyProps) {
  const t = useT();
  const strings = t.projectDetail;
  const metadata = getProjectMetadata(project);
  const socialLinks = metadata.socialLinks;
  const creatorId = project.source?.author?.id || project.source?.ownerId;
  const creatorHref = creatorId
    ? `/creator?id=${encodeURIComponent(creatorId)}`
    : undefined;

  // Membuat tombol aksi dengan posisi tooltip sesuai tempat tampilnya
  const renderActionButtons = (tooltipSide: "left" | "top" = "top") => (
    <>
      <ProjectIconButton
        active={liked}
        disabled={actionsDisabled}
        label={strings.like}
        onClick={onLike}
        tooltipSide={tooltipSide}
      >
        <Heart className="size-[18px]" weight={liked ? "fill" : "regular"} />
      </ProjectIconButton>
      <ProjectIconButton
        active={saved}
        disabled={actionsDisabled}
        label={strings.save}
        onClick={onToggleSaved}
        tooltipSide={tooltipSide}
      >
        <BookmarkSimple
          className="size-[18px]"
          weight={saved ? "fill" : "regular"}
        />
      </ProjectIconButton>
      <ProjectIconButton
        disabled
        label={strings.share}
        onClick={onShare}
        tooltipSide={tooltipSide}
      >
        <ShareNetwork className="size-[18px]" />
      </ProjectIconButton>
      <ProjectIconButton
        disabled
        label={strings.discussion}
        onClick={onDiscussion}
        tooltipSide={tooltipSide}
      >
        <ChatCircle className="size-[18px]" />
      </ProjectIconButton>
      <ProjectIconButton
        label={strings.details}
        onClick={onDetails}
        tooltipSide={tooltipSide}
      >
        <Info className="size-[18px]" />
      </ProjectIconButton>
    </>
  );

  return (
    <>
      {!discussionOpen ? (
        <>
          <div className="fixed right-16 top-3 z-[130] flex items-center gap-2">
            {ownerActions}
          </div>
          <button
            aria-label={strings.closeProject}
            className="fixed right-5 top-4 z-[130] flex size-12 items-center justify-center rounded-full text-copy-secondary transition-[color,transform] duration-200 hover:bg-surface-muted hover:text-heading active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
            onClick={onClose}
            type="button"
          >
            <X className="size-3.5" weight="bold" />
          </button>
        </>
      ) : null}

      {/* Sticky Actions */}
      <aside
        aria-label="Sticky project actions"
        className="t-panel-slide fixed right-5 top-1/2 z-[123] hidden -translate-y-1/2 flex-col items-center gap-2 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-overlay p-2.5 shadow-[var(--shadow-panel)] m3-large:flex"
        data-open={compactActions && !discussionOpen ? "true" : "false"}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <a
                aria-label={project.author.name}
                className="mb-1 flex size-12 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
                href={creatorHref}
              />
            }
          >
            <ProjectAvatar
              avatarUrl={project.author.avatarUrl}
              className="size-11 ring-2 ring-surface"
              name={project.author.name}
            />
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={10}>
            {project.author.name}
          </TooltipContent>
        </Tooltip>
        {renderActionButtons("left")}
        <ProjectIconButton
          disabled
          label={strings.getInTouch}
          tooltipSide="left"
        >
          <EnvelopeSimple className="size-[18px]" />
        </ProjectIconButton>
      </aside>

      {/* Project Panel */}
      <div
        className={cn(
          // Membuat panel lebih kecil dengan jarak kiri dan kanan yang sama
          !discussionOpen && "m3-large:mx-[94px]",
        )}
      >
        <motion.div
          animate={{ marginRight: discussionOpen ? "min(430px, 36vw)" : 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <main className="mx-auto w-full max-w-[1680px] px-4 py-12 m3-medium:px-6 m3-large:px-8 m3-large:py-16">
            {/* Project Header */}
            <div className="flex min-w-0 flex-col gap-6 m3-medium:flex-row m3-medium:items-end m3-medium:justify-between">
              <div className="min-w-0">
                <p className="mb-4 m3-label-medium text-copy-secondary">
                  {project.primaryTag || "Project"} ·{" "}
                  {formatProjectText(strings.published, {
                    days: project.ageDays,
                  })}
                </p>
                <h1 className="m3-headline-large max-w-3xl break-words text-balance">
                  {project.title}
                </h1>
                <a
                  className="mt-5 flex min-h-12 w-fit items-center gap-3 rounded-[var(--radius-control)] px-1 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
                  href={creatorHref}
                >
                  <ProjectAvatar
                    avatarUrl={project.author.avatarUrl}
                    name={project.author.name}
                  />
                  <div>
                    <p className="m3-label-large">{project.author.name}</p>
                    <p className="m3-body-small text-copy-secondary">
                      {project.author.headline || strings.availableForWork}
                    </p>
                  </div>
                  {project.author.pro ? (
                    <span className="flex size-4 items-center justify-center rounded-full bg-brand text-on-brand">
                      <Check className="size-2.5" weight="bold" />
                    </span>
                  ) : null}
                </a>
                {socialLinks.length ? (
                  <div className="mt-4 flex items-center gap-2">
                    {socialLinks.map(({ platform, url, Icon }) => (
                      <a
                        aria-label={platform}
                        className="flex size-12 items-center justify-center rounded-full border border-border-subtle text-copy-secondary transition-colors hover:border-border-strong hover:text-heading focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
                        href={url}
                        key={platform}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <Icon className="size-4" />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {renderActionButtons()}
                <button
                  className="m3-label-medium ml-1 cursor-not-allowed rounded-full bg-surface-muted px-5 py-3 text-copy-secondary/50"
                  disabled
                  type="button"
                >
                  {strings.getInTouch}
                </button>
              </div>
            </div>

            {/* Project Content */}
            <div className="relative isolate mt-9 w-full overflow-hidden rounded-[var(--radius-card)] border-0 bg-transparent outline-none ring-0 [clip-path:inset(0_round_var(--radius-card))] [transform:translateZ(0)]">
              {project.source ? (
                <ProjectContent project={project.source} />
              ) : (
                <motion.img
                  animate={{ opacity: 1, y: 0 }}
                  alt={project.title}
                  className="aspect-[16/10] w-full object-cover"
                  initial={{ opacity: 0, y: 18 }}
                  src={project.image}
                  transition={{ duration: 0.65 }}
                />
              )}
            </div>

            {related.length ? (
              <section className="mt-20 border-t border-border-subtle pt-10">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="m3-headline-small">{strings.moreLikeThis}</h2>
                  <a
                    className="m3-label-large inline-flex min-h-12 items-center rounded-full px-3 py-2 text-copy-secondary transition-colors hover:bg-surface-muted hover:text-copy focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
                    href="/explore"
                    onClick={onClose}
                  >
                    {strings.viewAll}
                  </a>
                </div>
                <div className="mt-7 grid min-w-0 gap-5 m3-medium:grid-cols-3">
                  {related.map((item) => (
                    <ProjectCard
                      interactive={false}
                      key={item.id}
                      likeAria={t.explore.likeAria}
                      onOpen={() => onSelect(item)}
                      project={item}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </main>
        </motion.div>
      </div>
    </>
  );
}
