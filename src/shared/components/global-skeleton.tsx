import { DashboardLoading } from "@/shared/layout/dashboard/dashboard-loading";
import { SiteFrame } from "@/shared/ui/site-frame";
import { Skeleton } from "@/shared/ui/skeleton";

function LandingNavigationSkeleton() {
  return (
    <header className="fixed inset-x-0 top-0 z-10 w-full rounded-b-[var(--radius-feature)] bg-action-ink shadow-[var(--shadow-panel)] m3-laptop:top-3.5 m3-laptop:right-auto m3-laptop:left-1/2 m3-laptop:w-[calc(100%_-_8rem)] m3-laptop:max-w-5xl m3-laptop:-translate-x-1/2">
      <div className="flex h-18 items-center justify-between px-4 m3-medium:px-6 m3-laptop:h-20 m3-laptop:pl-6 m3-laptop:pr-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-7 rounded-[var(--radius-control)]" />
          <Skeleton className="hidden h-5 w-24 rounded-[var(--radius-control)] m3-laptop:block" />
        </div>
        <div className="hidden items-center gap-1 m3-laptop:flex">
          <Skeleton className="h-12 w-16 rounded-full" />
          <Skeleton className="h-12 w-20 rounded-full" />
          <Skeleton className="h-12 w-20 rounded-full" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="hidden h-10 w-28 rounded-[var(--radius-control)] m3-laptop:block" />
        </div>
      </div>
    </header>
  );
}

function LandingSkeleton({ gridOnly = false }: { gridOnly?: boolean }) {
  return (
    <main
      aria-busy="true"
      aria-label="Loading Priemman"
      className="global-skeleton min-h-dvh overflow-x-clip bg-surface pt-28 text-copy m3-laptop:pt-36"
      role="status"
    >
      {/* 0. Frame bukan data; tetap dirender agar transisi skeleton ke PublicPageShell presisi. */}
      <SiteFrame />

      {/* 1. Navbar skeleton mempertahankan tinggi dan lebar Navbar public yang sebenarnya. */}
      <LandingNavigationSkeleton />

      {/* 2. Area konten memakai gutter dan max-width page public, supaya tidak bergeser saat data hadir. */}
      <div className="mx-auto w-full max-w-[1440px] px-[var(--page-gutter)] pb-12">
        {gridOnly ? (
          <section>
            <Skeleton className="h-10 w-52 rounded-[var(--radius-control)]" />
            <Skeleton className="mt-3 h-5 w-80 max-w-full rounded-[var(--radius-control)]" />
            <Skeleton className="mt-10 h-12 w-40 rounded-[var(--radius-control)]" />
            <div className="mt-12 grid gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-extra-large:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div className="space-y-3" key={index}>
                  <Skeleton className="aspect-[4/3] rounded-[var(--radius-feature)]" />
                  <Skeleton className="h-5 w-3/5 rounded-[var(--radius-control)]" />
                  <Skeleton className="h-4 w-2/5 rounded-[var(--radius-control)]" />
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="flex min-h-[calc(100dvh-9rem)] flex-col items-center justify-center text-center m3-laptop:min-h-[calc(100dvh-11rem)]">
            <Skeleton className="h-10 w-72 max-w-[80vw] rounded-full" />
            <Skeleton className="mt-10 h-16 w-[min(48rem,86vw)] rounded-[var(--radius-card)] m3-medium:h-24" />
            <Skeleton className="mt-4 h-16 w-[min(38rem,72vw)] rounded-[var(--radius-card)] m3-medium:h-24" />
            <Skeleton className="mt-8 h-5 w-[min(36rem,82vw)] rounded-[var(--radius-control)]" />
            <Skeleton className="mt-3 h-5 w-[min(28rem,68vw)] rounded-[var(--radius-control)]" />
            <Skeleton className="mt-10 h-12 w-36 rounded-[var(--radius-control)]" />

            {/* 3. Slot Explore tetap tersedia agar layout tidak melonjak ketika proyek selesai dimuat. */}
            <div className="mt-16 grid w-full grid-cols-1 gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-expanded:grid-cols-4 m3-large:grid-cols-5">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton
                  className="h-72 rounded-[var(--radius-card)] m3-medium:h-96"
                  key={index}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function AuthSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading authentication"
      // bg-surface, konsisten dengan AuthShell (lihat auth-shell.tsx) — supaya
      // skeleton loading tidak "berkedip" pindah warna saat AuthShell asli muncul.
      className="global-skeleton relative min-h-dvh overflow-x-clip bg-surface text-copy"
      role="status"
    >
      {/* 0. AuthShell juga memakai SiteFrame yang sama dengan halaman public. */}
      <SiteFrame />

      {/* 1. Brand dan dua kontrol memakai posisi absolut AuthShell. */}
      <div className="absolute inset-x-4 top-4 z-10 flex min-h-12 items-center justify-between gap-4 m3-medium:inset-x-6 m3-medium:top-5 m3-large:inset-x-10 m3-large:top-8">
        <div className="flex items-center gap-2.5 px-1">
          <Skeleton className="size-8 rounded-[var(--radius-control)]" />
          <Skeleton className="h-6 w-28 rounded-[var(--radius-control)]" />
        </div>
        <div className="flex items-center gap-1.5 m3-medium:gap-2">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
        </div>
      </div>

      {/* 2. Dua kolom mengikuti AuthShell: form maksimum md dan preview portrait 7:8. */}
      <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col items-center justify-center gap-8 m3-large:grid m3-large:grid-cols-2 m3-large:gap-[var(--grid-gap)] m3-large:px-[var(--page-gutter)]">
        <section className="flex w-full items-center justify-center px-4 pb-8 pt-28 m3-medium:px-8 m3-medium:pb-10 m3-medium:pt-32 m3-large:px-0 m3-large:py-24">
          <div className="flex w-full max-w-md flex-col items-center gap-6 m3-medium:gap-8">
            <div className="flex w-full flex-col items-center gap-3">
              <Skeleton className="h-12 w-72 max-w-[80vw] rounded-[var(--radius-card)]" />
              <Skeleton className="h-5 w-80 max-w-[82vw] rounded-[var(--radius-control)]" />
            </div>
            <div className="w-full rounded-[var(--radius-card)] border border-border-subtle bg-surface-raised p-3 min-[390px]:p-4 m3-medium:p-6">
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-[var(--radius-control)]" />
                <Skeleton className="h-12 w-full rounded-[var(--radius-control)]" />
                <Skeleton className="mx-auto h-4 w-32 rounded-[var(--radius-control)]" />
                <Skeleton className="h-5 w-16 rounded-[var(--radius-control)]" />
                <Skeleton className="h-12 w-full rounded-[var(--radius-control)]" />
                <Skeleton className="h-12 w-full rounded-[var(--radius-control)]" />
              </div>
            </div>
          </div>
        </section>
        <section className="hidden min-w-0 items-center justify-center m3-large:flex m3-large:pb-8 m3-large:pt-24">
          <Skeleton className="aspect-[7/8] max-h-[calc(100dvh-12rem)] w-full max-w-[35rem] rounded-[var(--radius-card)]" />
        </section>
      </div>
    </main>
  );
}

function DashboardSkeleton() {
  // Dashboard User memakai skeleton yang sama saat route loading maupun GET /users/me.
  return <DashboardLoading label="Loading dashboard" />;
}

export function GlobalSkeleton({ pathname = "/" }: { pathname?: string }) {
  if (pathname.startsWith("/dashboard")) return <DashboardSkeleton />;
  if (pathname.startsWith("/login")) return <AuthSkeleton />;
  if (pathname.startsWith("/explore") || pathname.startsWith("/contact")) {
    return <LandingSkeleton gridOnly />;
  }
  return <LandingSkeleton />;
}
