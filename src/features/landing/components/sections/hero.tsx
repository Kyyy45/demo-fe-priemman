"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/shared/lib/gsap";
import AccordionGallery from "@/shared/ui/AccordionGallery";
import LogoLoop, { type LogoItem } from "@/shared/ui/LogoLoop";
import { useT } from "@/shared/providers/language-provider";
import { getAvatarFallbackUrl } from "@/shared/lib/avatar";
import { AvatarStack } from "@/shared/ui/avatar-stack";
import { PrimaryActionLink } from "@/features/landing/components/shared/primary-action-link";

// Warna dasar yang dipakai selama animasi Hero
const HERO_BG = "var(--surface)";

// Nama anggota yang tampil pada avatar stack
const teamMembers = ["Maya", "Jonas", "Aida", "Reza", "Kim"];

// Logo alat yang dipakai kreator (dari svgl.app, disimpan di /public/tool-logos).
// Urutan diselang-seling antar disiplin supaya logo Adobe tidak berkumpul.
// `dark` = varian untuk tema gelap, bagi logo yang hitam di tema terang.
const TOOL_LOGOS: { name: string; src: string; dark?: string }[] = [
  { name: "Figma", src: "figma.svg" },
  { name: "Photoshop", src: "photoshop.svg" },
  { name: "Blender", src: "blender.svg" },
  { name: "Illustrator", src: "illustrator.svg" },
  { name: "Canva", src: "canva.svg" },
  { name: "After Effects", src: "after-effects.svg" },
  { name: "Framer", src: "framer.svg", dark: "framer_dark.svg" },
  { name: "Premiere Pro", src: "premiere.svg" },
  { name: "Affinity Designer", src: "affinity_designer.svg" },
  { name: "Lightroom", src: "lightroom.svg" },
  { name: "Penpot", src: "penpot.svg", dark: "penpot_dark.svg" },
  { name: "InDesign", src: "indesign.svg" },
  { name: "Sketch", src: "sketch_light.svg", dark: "sketch.svg" },
  { name: "Unreal Engine", src: "unreal_engine.svg", dark: "unreal_engine_dark.svg" },
];
const TOOL_LOGO_CLASS = "h-[var(--logoloop-logoHeight)] w-auto object-contain";
const loopLogos: LogoItem[] = TOOL_LOGOS.map(({ name, src, dark }) =>
  dark
    ? {
        ariaLabel: name,
        title: name,
        node: (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG statis, sama seperti LogoLoop */}
            <img alt="" className={`${TOOL_LOGO_CLASS} block dark:hidden`} draggable={false} src={`/tool-logos/${src}`} />
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG statis, sama seperti LogoLoop */}
            <img alt="" className={`${TOOL_LOGO_CLASS} hidden dark:block`} draggable={false} src={`/tool-logos/${dark}`} />
          </>
        ),
      }
    : { alt: name, src: `/tool-logos/${src}`, title: name },
);

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
            avatars={teamMembers.map((name) => ({ name, src: getAvatarFallbackUrl(name) }))}
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
