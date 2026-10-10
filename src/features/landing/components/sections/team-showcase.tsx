"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/shared/lib/gsap";
import { useT } from "@/shared/providers/language-provider";

/** Source: Skiper UI 79, free license — https://skiper-ui.com/v1/skiper79 */

// Kreator Priemman. Tiap kreator punya dua foto (crop 1:1, fokus ke wajah,
// di /public/team); foto yang belum ada tampil sebagai kotak placeholder.
const CREATORS: { name: string; role: string; photos: [string?, string?] }[] = [
  {
    name: "Rizky Akbar",
    role: "Frontend Developer",
    photos: ["/team/rizky-akbar-1.webp", "/team/rizky-akbar-2.webp"],
  },
  {
    name: "Yoga Dwi Noviyanto",
    role: "Sales Manager",
    photos: ["/team/yoga-dwi-noviyanto-1.webp"],
  },
  { name: "Ari Susanto", role: "Backend Developer", photos: [] },
  {
    name: "Aditya Putra Wardhana",
    role: "Content Strategist",
    photos: ["/team/aditya-putra-wardhana-1.webp", "/team/aditya-putra-wardhana-2.webp"],
  },
  { name: "Kautsar Qaris Septyawan", role: "Backend Developer", photos: [] },
  {
    name: "Rendy Amy Saputra",
    role: "Marketing Manager",
    photos: ["/team/rendy-amy-saputra-1.webp", "/team/rendy-amy-saputra-2.webp"],
  },
];

// Urutan kotak: putaran pertama foto ke-1 tiap kreator, putaran kedua foto
// ke-2, supaya foto orang yang sama tidak bersebelahan (12 kotak, genap).
const CELLS = [0, 1].flatMap((photoIndex) =>
  CREATORS.map((creator) => ({ ...creator, src: creator.photos[photoIndex] })),
);

// Kolom (0–3) yang terisi di setiap baris showcase; totalnya = CELLS.length.
const ROWS: number[][] = [
  [0, 2],
  [1, 3],
  [0],
  [2, 3],
  [1],
  [0, 3],
  [1, 2],
];

export function TeamShowcase() {
  const t = useT();

  // Menyimpan section yang menjadi target animasi GSAP
  const sectionRef = useRef<HTMLElement>(null);

  // Menentukan kotak berikutnya saat card dibuat
  let cellCursor = 0;

  // Menjalankan animasi card saat section masuk ke viewport
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        section.querySelectorAll<HTMLElement>("[data-team-row]").forEach((row) => {
          const cells = row.querySelectorAll<HTMLElement>("[data-team-cell]");
          if (!cells.length) return;

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: row,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.5,
            },
          });
          timeline
            .fromTo(
              cells,
              { scale: 0 },
              { scale: 1, ease: "none", duration: 1, stagger: 0.12 },
              0,
            )
            .to(
              cells,
              { scale: 0, ease: "none", duration: 1, stagger: 0.12 },
              1.8,
            );
        });
      }, section);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} id="team" className="relative bg-surface">
      {/* Team Heading */}
      <div className="pointer-events-none sticky top-0 z-20 flex h-dvh flex-col items-center justify-center mix-blend-exclusion">
        <h2 className="text-center type-display text-on-dark">
          {t.team.title}
        </h2>
        <p className="mt-4 type-metadata tracking-widest text-on-dark/50 uppercase">
          {t.team.subtitle}
        </p>
      </div>

      {/* Team Grid */}
      <div className="container-site relative -mt-[60dvh] flex flex-col pb-24">
        {ROWS.map((columns, rowIndex) => (
          <div key={rowIndex} data-team-row className="flex w-full">
            {[0, 1, 2, 3].map((columnIndex) => {
              if (!columns.includes(columnIndex)) {
                return <div key={columnIndex} className="aspect-square flex-1" />;
              }
              const cell = CELLS[cellCursor];
              const origin =
                cellCursor % 2 === 0 ? "left bottom" : "right bottom";
              cellCursor += 1;
              return (
                <div key={columnIndex} className="aspect-square flex-1">
                  <div
                    data-team-cell
                    className="relative h-full w-full"
                    style={{ transformOrigin: origin }}
                  >
                    {cell.src ? (
                      // Hitam-putih lewat CSS (grayscale + sedikit kontras),
                      // seperti foto editorial di referensi Skiper UI.
                      <Image
                        alt={cell.name}
                        className="object-cover contrast-110 grayscale"
                        fill
                        sizes="(min-width: 75rem) 300px, 25vw"
                        src={cell.src}
                      />
                    ) : (
                      <div aria-label={cell.name} className="h-full w-full bg-surface-container-high" role="img" />
                    )}
                    {/* Kotak di ponsel hanya ~86px: peran turun ke bawah nama;
                        mulai tablet nama di kiri, peran di kanan. */}
                    <div className="absolute inset-x-0 -bottom-2 flex translate-y-full flex-col gap-0.5 px-0.5 type-metadata tracking-wide uppercase opacity-40 max-m3-medium:text-[0.625rem] max-m3-medium:leading-tight m3-medium:flex-row m3-medium:justify-between m3-medium:gap-2">
                      <span>{cell.name}</span>
                      <span className="m3-medium:text-right">({cell.role})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
