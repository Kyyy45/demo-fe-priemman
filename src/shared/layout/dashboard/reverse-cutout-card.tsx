"use client";

import { ArrowUpRight } from "@phosphor-icons/react";

import {
  CutoutCard,
  CutoutCardAction,
  CutoutCardPin,
  CutoutCorner,
} from "@/shared/ui/cutout-card";

// Kartu metrik dashboard (user, creator, admin). Cutout berada di kanan
// bawah, kebalikan card Explore yang memotong sisi atas.
export function ReverseCutoutCard({
  surfaceClassName,
  title,
  description,
  metric,
  onClick,
}: {
  surfaceClassName: string;
  title: string;
  description: string;
  metric: number | string;
  onClick: () => void;
}) {
  return (
    <CutoutCard
      className={`group relative min-h-[9.875rem] overflow-hidden text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand m3-medium:min-h-40 ${surfaceClassName}`}
      initial={false}
      onClick={onClick}
      trackPointerHover={false}
    >
      <span className="absolute inset-x-0 top-0 bottom-12 rounded-t-[var(--radius-card)] rounded-br-[20px] bg-[var(--metric-surface)] m3-medium:bottom-[3.25rem]" />
      <span className="absolute inset-y-0 left-0 right-12 rounded-l-[var(--radius-card)] rounded-br-[20px] bg-[var(--metric-surface)] m3-medium:right-[3.25rem]" />
      <CutoutCorner
        className="absolute bottom-7 right-7 [transform:rotate(180deg)] text-[var(--metric-surface)] m3-medium:bottom-8 m3-medium:right-8"
        size={20}
      />
      <span className="absolute inset-0 flex min-w-0 flex-col p-1.5 pb-12 min-[23.5rem]:p-3 min-[23.5rem]:pb-14 m3-medium:p-4 m3-medium:pb-14">
        <span className="dashboard-card-title line-clamp-2 break-normal !text-xs !leading-[1.25] min-[23.5rem]:!text-sm m3-medium:!text-sm">
          {title}
        </span>
        <span className="dashboard-table-label mt-1 line-clamp-2 break-normal !text-[0.625rem] !leading-[1.3] min-[23.5rem]:!text-[0.6875rem] m3-medium:!text-xs">
          {description}
        </span>
        <strong className="mt-auto text-2xl font-semibold leading-none text-heading min-[23.5rem]:text-[1.75rem] m3-medium:text-[1.75rem]">
          {typeof metric === "number" ? metric.toLocaleString() : metric}
        </strong>
      </span>
      <CutoutCardPin className="bottom-0 right-0 p-1.5">
        <CutoutCardAction
          className="relative static transform-none opacity-100"
          revealOnHover={false}
        >
          <button
            aria-label={title}
            className="group/action flex size-[38px] cursor-pointer items-center justify-center rounded-full bg-action-ink text-on-dark shadow-[var(--shadow-control)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand m3-medium:size-10"
            onClick={(event) => {
              event.stopPropagation();
              onClick();
            }}
            type="button"
          >
            <ArrowUpRight
              className="icon-motion-arrow-up-right size-4"
              weight="bold"
            />
          </button>
        </CutoutCardAction>
      </CutoutCardPin>
    </CutoutCard>
  );
}
