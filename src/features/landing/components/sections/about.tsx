"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/shared/lib/gsap";
import { useT } from "@/shared/providers/language-provider";
import { cn } from "@/shared/lib/utils";
import { ArrowRightIcon } from "@/shared/ui/icons";

// Daftar gambar yang dipakai pada mosaic About
const ABOUT_IMAGES = [
  { aspect: "aspect-[4/3]" },
  { aspect: "aspect-[2/1]" },
  { aspect: "aspect-square" },
  { aspect: "aspect-[2/3]" },
  { aspect: "aspect-[3/4]" },
  { aspect: "aspect-[16/9]" },
];

// Menentukan isi dan posisi setiap kolom mosaic
const MOSAIC_COLUMNS: { images: [number, number]; offset: string }[] = [
  { images: [0, 1], offset: "mt-16 m3-medium:mt-40" },
  { images: [2, 3], offset: "" },
  { images: [4, 5], offset: "mt-8 m3-medium:mt-20" },
];

export function About() {
  const t = useT();

  // Menyimpan section yang menjadi target animasi GSAP
  const sectionRef = useRef<HTMLElement>(null);

  // Menjalankan animasi About sesuai ukuran layar
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          "[data-about-fade]",
          { autoAlpha: 0, y: 32 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 72%" },
          },
        );
        gsap.fromTo(
          "[data-about-img]",
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: 1.1,
            ease: "power3.out",
            stagger: 0.1,
            transformOrigin: "center bottom",
            scrollTrigger: {
              trigger: "[data-about-mosaic]",
              start: "top 80%",
            },
          },
        );
        gsap.fromTo(
          "[data-about-stat]",
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: "[data-about-stats]",
              start: "top 85%",
            },
          },
        );
      }, section);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} id="about" className="container-site relative flex flex-col py-[var(--landing-section-gap)]">
      {/* About Intro */}
      <div className="grid min-w-0 gap-10 m3-large:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] m3-large:gap-16">
        <div className="min-w-0">
          <span
            data-about-fade
            className="inline-flex min-h-8 items-center rounded-full bg-heading px-4 py-1.5 type-label font-medium text-canvas"
          >
            {t.about.badge}
          </span>
          <h2 data-about-fade className="type-section-title mt-6 font-heading">
            {t.about.heading}
          </h2>
        </div>
        <div className="flex min-w-0 flex-col items-start gap-6 m3-large:pt-14">
          <p data-about-fade className="type-body">
            {t.about.paragraph1}
          </p>
          <p data-about-fade className="type-body">
            {t.about.paragraph2}
          </p>
          <a
            data-about-fade
            href="#how-it-works"
            className="group mt-2 inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] type-label font-medium text-heading focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
          >
            {t.about.learnMore}
            <ArrowRightIcon size={16} />
          </a>
        </div>
      </div>

      {/* Image Mosaic */}
      <div data-about-mosaic className="mt-16 grid grid-cols-3 gap-[var(--grid-gap)] m3-medium:mt-24">
        {MOSAIC_COLUMNS.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className={cn("flex min-w-0 flex-col gap-[var(--grid-gap)]", column.offset)}
          >
            {column.images.map((imageIndex) => (
              <div
                key={imageIndex}
                data-about-img
                className={cn("w-full overflow-hidden", ABOUT_IMAGES[imageIndex].aspect)}
              >
                <div
                  aria-label={t.about.images[imageIndex].alt}
                  className="h-full w-full bg-surface-container-high"
                  role="img"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* About Stats */}
      <div
        data-about-stats
        className="mt-20 grid grid-cols-1 gap-10 m3-medium:mt-28 m3-medium:grid-cols-3 m3-medium:gap-0"
      >
        {t.about.stats.map((stat, index) => (
          <div
            key={stat.value}
            data-about-stat
            className={cn(
              "flex flex-col items-center gap-4 px-6 py-4 text-center",
              index < 2 && "m3-medium:border-r m3-medium:border-border-subtle",
            )}
          >
            <span className="font-heading type-page-title tracking-tight text-heading">
              {stat.value}
            </span>
            <span className="max-w-55 type-body text-copy-secondary">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
