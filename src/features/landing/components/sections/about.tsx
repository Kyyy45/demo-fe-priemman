"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/shared/lib/gsap";
import { useT } from "@/shared/providers/language-provider";
import { AboutBento } from "@/features/landing/components/sections/about-bento";

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
        // Kartu bento berisi teks & mockup: muncul naik + memudar, bukan
        // scaleY (yang membuat isinya gepeng selama animasi).
        gsap.fromTo(
          "[data-about-img]",
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: "[data-about-mosaic]",
              start: "top 80%",
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
        </div>
      </div>

      {/* Bento: koleksi, komunitas, kalender, Creator Studio, analitik, Explore */}
      <AboutBento />
    </section>
  );
}
