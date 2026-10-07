"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/shared/lib/gsap";
import { useT } from "@/shared/providers/language-provider";
import { cn } from "@/shared/lib/utils";
import { ArrowRightIcon, PlusIcon } from "@/shared/ui/icons";

export function Faq() {
  const t = useT();

  // Menyimpan section yang menjadi target animasi GSAP
  const sectionRef = useRef<HTMLElement>(null);

  // Menyimpan pertanyaan FAQ yang sedang dibuka
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Menjalankan animasi FAQ saat section masuk ke viewport
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          "[data-faq-fade]",
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 75%" },
          },
        );
      }, section);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} id="faq" className="container-site py-[var(--landing-section-gap)]">
      <div className="grid min-w-0 gap-12 m3-large:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] m3-large:gap-20">
        {/* FAQ Intro */}
        <div className="min-w-0 m3-large:sticky m3-large:top-28 m3-large:self-start">
          <span
            data-faq-fade
            className="inline-flex min-h-8 items-center rounded-full bg-heading px-4 py-1.5 type-label font-medium text-canvas"
          >
            {t.faq.badge}
          </span>
          <h2 data-faq-fade className="type-section-title mt-6 font-heading">
            {t.faq.title}
          </h2>
          <p data-faq-fade className="type-body mt-5">
            {t.faq.subtitle}
          </p>
          <a
            data-faq-fade
            href="mailto:support@priemman.my.id"
            className="group mt-8 inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] type-label font-semibold text-heading focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
          >
            {t.faq.supportLink}
            <ArrowRightIcon size={16} />
          </a>
        </div>

        {/* FAQ List */}
        <div className="min-w-0 border-border-subtle border-t">
          {t.faq.items.map((item, index) => {
            const open = openIndex === index;
            return (
              <div key={item.q} data-faq-fade className="border-border-subtle border-b">
                <button
                  type="button"
                  id={`faq-trigger-${index}`}
                  aria-expanded={open}
                  aria-controls={`faq-panel-${index}`}
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-6 py-6 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-brand"
                >
                  <span className="type-body font-semibold text-heading">{item.q}</span>
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle text-heading transition-all duration-300",
                      open && "bg-heading text-canvas rotate-45 border-transparent",
                    )}
                  >
                    <PlusIcon size={16} />
                  </span>
                </button>
                <div
                  id={`faq-panel-${index}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${index}`}
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-xl pb-6 type-body text-copy-secondary">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
