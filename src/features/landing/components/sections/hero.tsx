"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/shared/lib/gsap";
import AccordionGallery from "@/shared/ui/AccordionGallery";
import LogoLoop, { type LogoItem } from "@/shared/ui/LogoLoop";
import { useT } from "@/shared/providers/language-provider";
import { AvatarStack } from "@/shared/ui/avatar-stack";
import { PrimaryActionLink } from "@/features/landing/components/shared/primary-action-link";

// Warna dasar yang dipakai selama animasi Hero
const HERO_BG = "var(--surface)";

// Nama anggota yang tampil pada avatar stack
const teamMembers = ["Maya", "Jonas", "Aida", "Reza", "Kim"];

// Placeholder kosong untuk logo teknologi; aset lokal akan ditambahkan kemudian.
const TECHNOLOGY_NAMES = ["React", "Next.js", "Tailwind CSS", "Laravel", "PHP", "C++", "MongoDB", "MariaDB", "PostgreSQL", "Svelte", "JavaScript", "TypeScript", "Adobe Illustrator", "Photoshop", "Python", "Adobe Premiere Pro"];
const loopLogos: LogoItem[] = TECHNOLOGY_NAMES.map((name) => ({
  ariaLabel: `${name} placeholder`,
  node: <span aria-hidden="true" className="inline-block h-[var(--logoloop-logoHeight)] w-10 rounded-[var(--radius-control)] bg-surface-container-high" />,
  title: name,
}));

// Gambar default untuk gallery Hero
const GALLERY_IMAGES = Array<string>(5).fill("");

export function Hero() {
  const t = useT();
  // Menyimpan section yang menjadi target animasi GSAP
  const sectionRef = useRef<HTMLElement>(null);

  // Menggabungkan copy terjemahan dengan gambar gallery
  const galleryItems = t.hero.gallery.map((item, index) => ({
    image: GALLERY_IMAGES[index],
    label: item.label,
    link: "#featured",
  }));

  // Menjalankan rangkaian animasi pembuka Hero
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.timeline().fromTo(
          "[data-hero-fade]",
          { autoAlpha: 0, y: 28 },
          { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.12, ease: "power3.out" }
        );
      }, section);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} id="home" className="relative flex flex-col overflow-hidden bg-surface">
      {/* Hero Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 rounded-b-[var(--radius-feature)] bg-surface"
      />

      {/* Hero Intro */}
      <div className="container-site flex flex-col items-center pt-24 text-center m3-medium:pt-32 m3-large:pt-36">
        <div
          data-hero-fade
          data-hero-team
          className="flex max-w-[calc(100vw-2rem)] flex-nowrap items-center justify-center rounded-full border border-border-subtle bg-surface-raised p-1 pr-2 shadow-[var(--shadow-control)] min-[360px]:pr-3 m3-medium:max-w-full m3-medium:pr-4"
        >
          <AvatarStack
            avatars={teamMembers.map((name) => ({ name }))}
            max={3}
            className="[&_[data-slot=avatar]]:size-6 [&_[data-slot=avatar-group-count]]:size-6 [&_[data-slot=avatar-group-count]]:type-metadata min-[360px]:[&_[data-slot=avatar]]:size-7 min-[360px]:[&_[data-slot=avatar-group-count]]:size-7 m3-medium:[&_[data-slot=avatar]]:size-8 m3-medium:[&_[data-slot=avatar-group-count]]:size-8"
          />
          <p className="type-metadata min-w-0 whitespace-nowrap pl-1.5 tracking-[-0.02em] text-copy-secondary min-[360px]:pl-2 m3-medium:pl-3">
            {t.hero.teamIntro}{" "}
            <strong className="font-medium text-heading">{t.hero.brand}</strong>
          </p>
        </div>

        <h1
          data-hero-fade
          className="type-display mt-10 max-w-5xl"
        >
          {t.hero.titleBefore}{" "}
          <span className="font-accent-serif text-brand">{t.hero.titleAccent}</span>
        </h1>

        <p
          data-hero-fade
          className="type-body-large mt-8 max-w-2xl"
        >
          {t.hero.subtitle}
        </p>

        <div
          data-hero-fade
          data-hero-cta
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <PrimaryActionLink href="#explore">{t.hero.cta}</PrimaryActionLink>
        </div>
      </div>

      {/* Featured Gallery */}
      <div id="featured" data-hero-fade className="container-site mt-14 scroll-mt-28 pb-16 m3-medium:mt-20 m3-medium:pb-20">
        <AccordionGallery
          items={galleryItems}
          height={540}
          gap={12}
          radius={20}
          tilt={6}
          grayscale
          accentColor="var(--brand-primary)"
          overlayColor={HERO_BG}
          textColor="var(--foreground)"
        />
      </div>

      {/* Technology Logos */}
      <div className="pb-16 m3-medium:pb-20">
        <LogoLoop
          logos={loopLogos}
          speed={80}
          logoHeight={26}
          gap={56}
          fadeOut
          fadeOutColor={HERO_BG}
          pauseOnHover
          ariaLabel={t.hero.logosAria}
        />
      </div>
    </section>
  );
}
