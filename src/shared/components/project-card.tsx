import { ArrowUpRight, Eye, Heart } from "@phosphor-icons/react";
import { motion } from "motion/react";

import type { Project } from "@/shared/lib/types/explore";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
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
  useCutoutContentStaggerVariants,
} from "@/shared/ui/cutout-card";

interface ProjectCardProps {
  project: Project;
  liked?: boolean;
  interactive?: boolean;
  onLike?: () => void;
  onOpen: () => void;
  likeAria: string;
}

// Menyingkat angka besar agar mudah dibaca pada card
const formatCount = (value: number) =>
  value >= 1000
    ? `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`
    : `${value}`;

export function ProjectCard({
  project,
  liked = false,
  interactive = true,
  onLike,
  onOpen,
  likeAria,
}: ProjectCardProps) {
  const stagger = useCutoutContentStaggerVariants();
  return (
    <CutoutCard
      className={cn(
        "group flex h-full cursor-pointer flex-col outline-none focus-visible:ring-3 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        cutoutCardSurfaceClassName,
        "!border-0 hover:!border-0",
      )}
      data-explore-card
      onClick={onOpen}
    >
      <CutoutCardMedia className="aspect-[4/3]">
        <CutoutCardImage
          alt={project.title}
          loading="lazy"
          src={project.image}
        />
        <CutoutCardOverlay />

        {/* Category Label */}
        <CutoutCardInsetLabel className="bottom-0 left-0 rounded-tr-[20px] bg-surface-raised px-4 py-2">
          <span className="type-metadata font-semibold uppercase tracking-widest text-copy-muted">
            {project.primaryTag || "Project"}
          </span>
          <CutoutCorner className="absolute -bottom-px -right-[31px] rotate-90 text-surface-raised" />
          <CutoutCorner className="absolute -left-px -top-[31px] rotate-90 text-surface-raised" />
        </CutoutCardInsetLabel>

        {/* Card Action */}
        <CutoutCardPin className="right-0 top-0 rounded-bl-[20px] bg-surface-raised p-1.5">
          <CutoutCardAction
            className="relative static transform-none opacity-100"
            revealOnHover={false}
          >
            <button
              aria-label={`Open ${project.title}`}
              className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-action-ink text-on-dark shadow-[var(--shadow-control)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
              type="button"
            >
              <ArrowUpRight
                className="icon-motion-arrow-up-right size-4"
                weight="bold"
              />
            </button>
          </CutoutCardAction>
          <CutoutCorner
            className="absolute -left-[31px] top-0 -rotate-90 text-surface-raised"
            size={32}
          />
          <CutoutCorner
            className="absolute -bottom-[31px] right-0 -rotate-90 text-surface-raised"
            size={32}
          />
        </CutoutCardPin>
      </CutoutCardMedia>

      <CutoutCardContent className="flex flex-1 flex-col p-[var(--card-padding)]">
        <motion.div
          animate="show"
          className="contents"
          initial="hidden"
          variants={stagger.container}
        >
          <motion.h2
            className="mb-1 line-clamp-1 text-balance type-card-title text-copy"
            variants={stagger.item}
          >
            {project.title}
          </motion.h2>
          <motion.div className="mt-auto" variants={stagger.item}>
            <CutoutCardFooter className="mt-4 border-t border-border-subtle/80 pt-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-8 shadow-[var(--shadow-control)] ring-2 ring-surface-raised">
                  <AvatarImage
                    alt={project.author.name}
                    src={project.author.avatarUrl}
                  />
                  <AvatarFallback>
                    {project.author.name.trim().charAt(0).toUpperCase() || "P"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate type-label font-medium text-copy">
                  {project.author.name}
                </span>
              </div>
              <span className="ml-auto flex shrink-0 items-center gap-3 type-metadata tabular-nums text-copy-muted">
                {interactive ? (
                  <button
                    aria-label={likeAria}
                    aria-pressed={liked}
                    className={cn(
                      "flex min-h-12 min-w-12 cursor-pointer items-center justify-center gap-1 rounded-full transition-colors hover:text-heading active:translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand",
                      liked && "text-brand hover:text-brand",
                    )}
                    onClick={(event) => {
                      event.stopPropagation();
                      onLike?.();
                    }}
                    type="button"
                  >
                    <Heart
                      className="size-4"
                      weight={liked ? "fill" : "regular"}
                    />
                    {formatCount(project.likes)}
                  </button>
                ) : (
                  <span className="flex items-center gap-1">
                    <Heart className="size-4" weight="regular" />
                    {formatCount(project.likes)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="size-4" weight="regular" />
                  {formatCount(project.views)}
                </span>
              </span>
            </CutoutCardFooter>
          </motion.div>
        </motion.div>
      </CutoutCardContent>
    </CutoutCard>
  );
}
