import Image from "next/image";

// Header banner halaman dashboard (Creator Studio, Collections, Admin) —
// identik dengan header menu Library (lihat project-library.tsx): class,
// padding, dan ukuran teks sama persis, tanpa baris eyebrow.
export function DashboardBanner({
  subtitle,
  title,
}: {
  subtitle: string;
  title: string;
}) {
  return (
    <header className="relative flex min-h-40 items-end overflow-hidden rounded-[var(--radius-card)] border border-brand/25 p-6 text-on-brand m3-medium:min-h-48">
      <Image
        alt=""
        className="object-cover"
        fill
        priority
        sizes="(max-width: 768px) 100vw, 1440px"
        src="/banner_card.png"
      />
      <div className="absolute inset-0 bg-heading/30 dark:bg-transparent" />
      <div className="relative min-w-0">
        <h1 className="dashboard-page-title !text-on-brand">{title}</h1>
        <p className="dashboard-body mt-3 !text-on-brand/75">{subtitle}</p>
      </div>
    </header>
  );
}
