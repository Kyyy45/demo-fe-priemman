import type { CSSProperties } from "react";

// Path SVG untuk sudut melengkung pada frame halaman
const CORNER_CURVE_PATH =
  "M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z";

export function CornerCurve({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      width="50"
      height="50"
      viewBox="0 0 50 50"
      fill="none"
      aria-hidden="true"
    >
      <path d={CORNER_CURVE_PATH} fill="currentColor" />
    </svg>
  );
}

// Frame 14px di empat sisi viewport + sudut melengkung, ciri khas visual landing.
// Elemen pointer-events-none dan hanya tampil dari breakpoint m3-laptop ke atas.
export function SiteFrame() {
  return (
    <>
      {/* Viewport Frame */}
      <div className="site-frame site-frame--top pointer-events-none fixed inset-x-0 top-0 z-[9999] hidden h-3.5 bg-surface-raised m3-laptop:block dark:bg-action-ink" />
      <div className="site-frame site-frame--bottom pointer-events-none fixed inset-x-0 bottom-0 z-[9999] hidden h-3.5 bg-surface-raised m3-laptop:block dark:bg-action-ink" />
      <div className="site-frame site-frame--left pointer-events-none fixed inset-y-0 left-0 z-[9999] hidden w-3.5 bg-surface-raised m3-laptop:block dark:bg-action-ink" />
      <div className="site-frame site-frame--right pointer-events-none fixed inset-y-0 right-0 z-[9999] hidden w-3.5 bg-surface-raised m3-laptop:block dark:bg-action-ink" />

      {/* Frame Corners */}
      <CornerCurve
        className="site-corner site-corner--top-left pointer-events-none fixed left-3.5 top-3.5 z-[9998] hidden text-surface-raised m3-laptop:block dark:text-action-ink"
        style={{ rotate: "90deg" }}
      />
      <CornerCurve
        className="site-corner site-corner--top-right pointer-events-none fixed right-3.5 top-3.5 z-[9998] hidden text-surface-raised m3-laptop:block dark:text-action-ink"
        style={{ rotate: "180deg" }}
      />
      <CornerCurve className="site-corner site-corner--bottom-left pointer-events-none fixed bottom-3.5 left-3.5 z-[9998] hidden text-surface-raised m3-laptop:block dark:text-action-ink" />
      <CornerCurve
        className="site-corner site-corner--bottom-right pointer-events-none fixed bottom-3.5 right-3.5 z-[9998] hidden text-surface-raised m3-laptop:block dark:text-action-ink"
        style={{ rotate: "270deg" }}
      />
    </>
  );
}
