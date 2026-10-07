"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/shared/lib/gsap";
import { useT } from "@/shared/providers/language-provider";
import { PrimaryActionLink } from "@/features/landing/components/shared/primary-action-link";

export function Cta() {
  const t = useT();

  // Menyimpan section yang menjadi target animasi GSAP
  const sectionRef = useRef<HTMLElement>(null);

  // Menjalankan animasi CTA saat section masuk ke viewport
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          "[data-cta-band]",
          { autoAlpha: 0, scale: 0.96 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 78%" },
          },
        );
        gsap.fromTo(
          "[data-cta-fade]",
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 70%" },
          },
        );
      }, section);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} className="container-site pb-[var(--landing-section-gap)]">
      {/* CTA Banner */}
      <div
        data-cta-band
        className="relative overflow-hidden rounded-[var(--radius-feature)] border border-border-subtle px-6 py-20 text-center shadow-[var(--shadow-panel)] m3-medium:px-16 m3-medium:py-28"
      >
        <div aria-hidden="true" className="absolute inset-0 bg-surface-container-high" />
        <div aria-hidden="true" className="absolute inset-0 bg-action-ink/65" />

        <h2 data-cta-fade className="type-section-title relative mx-auto max-w-3xl font-heading text-on-dark">
          {t.cta.titleBefore}{" "}
          <em className="font-accent-serif text-brand">{t.cta.titleAccent}</em> {t.cta.titleAfter}
        </h2>
        <p data-cta-fade className="relative mx-auto mt-6 max-w-xl type-body text-on-dark/70">
          {t.cta.subtitle}
        </p>

        <div data-cta-fade className="relative mt-10 flex justify-center">
          <PrimaryActionLink href="/login">{t.cta.button}</PrimaryActionLink>
        </div>
        <p data-cta-fade className="relative mt-6 type-label text-on-dark/50">
          {t.cta.note}
        </p>
      </div>
    </section>
  );
}
