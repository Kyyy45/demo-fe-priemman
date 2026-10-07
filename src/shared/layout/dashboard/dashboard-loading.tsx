import { Skeleton } from "@/shared/ui/skeleton";

export function DashboardLoading({
  cardCount = 3,
  label = "Loading dashboard",
}: {
  cardCount?: number;
  label?: string;
}) {
  return (
    <main
      aria-label={label}
      aria-live="polite"
      className="dashboard-manrope flex min-h-svh w-full gap-[var(--dashboard-frame)] bg-canvas p-[var(--dashboard-frame)]"
      role="status"
    >
      {/* 1. Shell loading mempertahankan frame card dashboard, sehingga tidak
          berubah menjadi rail penuh sebelum data user selesai dimuat. */}
      <aside className="hidden h-[calc(100svh-(var(--dashboard-frame)*2))] w-[var(--dashboard-navigation-width)] shrink-0 rounded-[var(--radius-card)] border border-sidebar-border bg-sidebar m3-expanded:block">
        <div className="flex h-full flex-col p-3">
          <div className="flex h-[var(--dashboard-menu-height)] items-center gap-3 px-3">
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          <div className="mt-6 space-y-[var(--dashboard-menu-gap)] px-1">
            <Skeleton className="h-3 w-16 rounded-sm" />
            <Skeleton className="h-[var(--dashboard-menu-height)] w-full rounded-[var(--radius-control)]" />
            <Skeleton className="h-[var(--dashboard-menu-height)] w-full rounded-[var(--radius-control)]" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-[var(--dashboard-frame)]">
        {/* 2. Header skeleton mempertahankan anatomy dan tinggi header dashboard. */}
        <header className="flex h-[var(--dashboard-header-height)] shrink-0 items-center justify-between rounded-[var(--radius-control)] border border-border-subtle bg-surface-container-low px-[var(--dashboard-header-padding)]">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-md" />
            <Skeleton className="h-4 w-28 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="size-10 rounded-full" />
          </div>
        </header>

        {/* 3. Grid dan padding mengikuti token konten Overview, bukan angka khusus skeleton. */}
        <div className="flex-1 pb-[var(--dashboard-content-padding)]">
          <div className="grid min-h-[calc(100svh-7.75rem)] grid-cols-1 gap-[var(--grid-gap)] m3-large:grid-cols-[minmax(0,1fr)_16.5rem_16.5rem] m3-large:grid-rows-[20rem_minmax(28rem,1fr)]">
            <Skeleton className="min-h-80 rounded-[var(--radius-card)]" />
            <Skeleton className="min-h-80 rounded-[var(--radius-card)]" />
            <Skeleton className="min-h-[calc(48rem+var(--grid-gap))] rounded-[var(--radius-card)] m3-large:col-start-3 m3-large:row-span-2" />
            <Skeleton className="min-h-72 rounded-[var(--radius-card)] m3-large:col-span-2" />
            <Skeleton className="min-h-44 rounded-[var(--radius-card)] m3-large:col-span-2" />
          </div>
        </div>
      </div>
    </main>
  );
}
