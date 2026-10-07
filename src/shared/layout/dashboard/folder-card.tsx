"use client";

import { ReverseCutoutCard } from "@/shared/layout/dashboard/reverse-cutout-card";

export type FolderMetric = {
  title: string;
  description: string;
  metric: number | string;
  onClick: () => void;
  /** Warna permukaan kartu, mis. "[--metric-surface:var(--dashboard-metric-liked)]". */
  surfaceClassName: string;
};

// Kartu "folder" pembuka overview dashboard (user, creator, admin): gambar
// berbentuk map dengan salam di tab dan tiga kartu metrik di dalamnya.
export function DashboardFolderCard({
  metrics,
  subtitle,
  title,
}: {
  metrics: FolderMetric[];
  subtitle: string;
  title: string;
}) {
  return (
    <figure className="relative min-h-80 w-full overflow-hidden">
      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full"
        preserveAspectRatio="none"
        viewBox="0 0 1000 320"
      >
        <defs>
          <clipPath id="dashboard-folder-clip">
            <path d="M0 84Q0 68 48 68H624Q638 68 648 55L690 10Q700 0 720 0H952Q1000 0 1000 24V296Q1000 320 952 320H48Q0 320 0 296Z" />
          </clipPath>
        </defs>
        <image
          clipPath="url(#dashboard-folder-clip)"
          height="320"
          href="/thumb_card.png"
          preserveAspectRatio="xMidYMid slice"
          width="1000"
        />
      </svg>
      <figcaption className="absolute left-0 right-[33%] top-2 z-10 min-w-0 overflow-hidden pr-3">
        <h1 className="dashboard-card-title block max-w-full overflow-hidden text-ellipsis whitespace-nowrap !text-base">
          {title}
        </h1>
        <p className="dashboard-body mt-0.5 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap !text-sm">
          {subtitle}
        </p>
      </figcaption>
      <div className="absolute inset-x-1.5 bottom-2 z-10 grid grid-cols-3 gap-1 min-[23.5rem]:inset-x-3 min-[23.5rem]:bottom-3 min-[23.5rem]:gap-2 m3-medium:inset-x-[var(--card-padding)] m3-medium:bottom-[var(--card-padding)] m3-medium:gap-3">
        {metrics.map((item) => (
          <ReverseCutoutCard
            description={item.description}
            key={item.title}
            metric={item.metric}
            onClick={item.onClick}
            surfaceClassName={item.surfaceClassName}
            title={item.title}
          />
        ))}
      </div>
    </figure>
  );
}
