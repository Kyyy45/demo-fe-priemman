import { Suspense } from "react";

import { Explore } from "@/features/landing/components/explore/explore";
import { About } from "@/features/landing/components/sections/about";
import { Faq } from "@/features/landing/components/sections/faq";
import { Hero } from "@/features/landing/components/sections/hero";
import { TeamShowcase } from "@/features/landing/components/sections/team-showcase";
import { PublicPageShell } from "@/features/landing/components/shared/public-page-shell";

/** Komposisi landing page publik; route hanya menjadi entry point. */
export default function LandingHomePage() {
  return (
    <PublicPageShell showFooter>
      <Hero />
      <About />
      <TeamShowcase />
      <Suspense fallback={null}>
        <Explore limit={20} showSeeMore />
      </Suspense>
      <Faq />
    </PublicPageShell>
  );
}
