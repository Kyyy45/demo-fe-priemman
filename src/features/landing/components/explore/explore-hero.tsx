"use client";

import { type ReactNode, useEffect, useState } from "react";

import { loadPublicFeed } from "@/shared/api/public-feed";
import { useLanguage } from "@/shared/providers/language-provider";
import { TextLoop } from "@/shared/ui/text-loop";

type FeedStats = {
  projects: number;
  creators: number;
  latestPublishedAt: string;
};

// "Hari ini", "3 hari lalu", lalu tanggal biasa untuk unggahan yang lebih lama.
function formatLatest(iso: string, locale: string) {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days < 30) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      -Math.max(0, days),
      "day",
    );
  }
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Hero khusus halaman /explore (landing memakai section Explore tanpa hero
 * ini). Angka di kanan atas dihitung dari feed publik yang sama dengan grid
 * di bawahnya — bukan angka statis. Filter grid (milik Explore) ditaruh di
 * kanan bawah lewat prop `filters`.
 */
export function ExploreHero({ filters }: { filters: ReactNode }) {
  const { lang, t } = useLanguage();
  const copy = t.exploreHero;
  const locale = lang === "id" ? "id-ID" : "en-US";
  const [stats, setStats] = useState<FeedStats | null>(null);

  useEffect(() => {
    let active = true;
    void loadPublicFeed()
      .then((feed) => {
        if (!active) return;
        // Sama dengan grid Explore: hanya PUBLISHED + PUBLIC.
        const projects = feed.filter(
          (project) =>
            project.status === "published" && project.visibility === "public",
        );
        setStats({
          projects: projects.length,
          creators: new Set(projects.map((project) => project.ownerId)).size,
          latestPublishedAt: projects.reduce(
            (latest, project) =>
              project.publishedAt > latest ? project.publishedAt : latest,
            "",
          ),
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const numberFormat = new Intl.NumberFormat(locale);
  const meta = [
    {
      label: copy.projects,
      value: stats ? numberFormat.format(stats.projects) : "—",
    },
    {
      label: copy.creators,
      value: stats ? numberFormat.format(stats.creators) : "—",
    },
    {
      label: copy.latest,
      value: stats ? formatLatest(stats.latestPublishedAt, locale) || "—" : "—",
    },
  ];

  return (
    <section className="container-site flex min-h-[calc(100svh-5rem)] min-w-0 flex-col justify-between gap-10 pb-12 pt-8 m3-expanded:min-h-[calc(100svh-6rem)] m3-expanded:pt-12 m3-large:min-h-[calc(100svh-7rem)]">
      {/* Judul + angka feed */}
      <div className="grid min-w-0 gap-8 m3-expanded:grid-cols-[minmax(0,1fr)_auto] m3-expanded:items-start m3-expanded:gap-16">
        <h1 className="max-w-2xl type-page-title font-heading">{copy.title}</h1>
        <dl className="grid grid-cols-[auto_auto] justify-start gap-x-10 gap-y-2 type-label m3-expanded:justify-end m3-expanded:pt-3">
          {meta.map((item) => (
            <div className="contents" key={item.label}>
              <dt className="text-copy-muted m3-expanded:text-right">
                {item.label}
              </dt>
              <dd className="font-medium text-heading m3-expanded:text-right">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Pita teks berjalan: selebar layar, keluar dari padding container.
          Di layar sempit SVG dilebarkan supaya teksnya tetap besar. */}
      <div className="relative left-1/2 w-screen max-w-none -translate-x-1/2 overflow-hidden">
        <TextLoop
          color="var(--brand-on-primary)"
          curviness={22}
          fontSize={56}
          fontWeight={700}
          label={copy.loop}
          letterSpacing={0}
          ribbonColor="var(--brand-primary)"
          ribbonWidth={100}
          separator="✦"
          speed={80}
          svgClassName="relative left-1/2 w-[220%] max-w-none -translate-x-1/2 m3-medium:w-[140%] m3-large:w-full"
          text={copy.loop}
          uppercase={false}
          viewHeight={300}
        />
      </div>

      {/* Deskripsi + filter grid */}
      <div className="flex min-w-0 flex-col gap-8 m3-expanded:flex-row m3-expanded:items-end m3-expanded:justify-between">
        <p className="max-w-xl type-body-large text-copy-secondary">
          {copy.description}
        </p>
        <div className="min-w-0 m3-expanded:shrink-0">{filters}</div>
      </div>
    </section>
  );
}
