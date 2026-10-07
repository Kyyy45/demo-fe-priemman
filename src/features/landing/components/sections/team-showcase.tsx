"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/shared/lib/gsap";
import { useT } from "@/shared/providers/language-provider";

/** Source: Skiper UI 79, free license — https://skiper-ui.com/v1/skiper79 */

// Susunan anggota pada setiap baris showcase
const ROWS: number[][] = [
  [0, 2],
  [1],
  [0, 3],
  [1, 2],
  [0, 3],
  [2],
  [1, 3],
  [0, 2],
  [1],
  [0, 3],
];

export function TeamShowcase() {
  const t = useT();

  // Menyimpan section yang menjadi target animasi GSAP
  const sectionRef = useRef<HTMLElement>(null);

  // Menentukan anggota berikutnya saat card dibuat
  let memberCursor = 0;

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
              const member = t.team.members[memberCursor];
              const origin =
                memberCursor % 2 === 0 ? "left bottom" : "right bottom";
              memberCursor += 1;
              return (
                <div key={columnIndex} className="aspect-square flex-1">
                  <div
                    data-team-cell
                    className="relative h-full w-full"
                    style={{ transformOrigin: origin }}
                  >
                    <div aria-label={`${member.name} placeholder`} className="h-full w-full bg-surface-container-high" role="img" />
                    <div className="absolute inset-x-0 -bottom-2 flex translate-y-full justify-between px-0.5 type-metadata tracking-wide uppercase opacity-40">
                      <span>{member.name}</span>
                      <span className="text-right">({member.role})</span>
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
