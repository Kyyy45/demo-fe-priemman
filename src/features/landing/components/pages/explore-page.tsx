import { Suspense } from "react";

import { Explore } from "@/features/landing/components/explore/explore";
import { PublicPageShell } from "@/features/landing/components/shared/public-page-shell";

/** Halaman Explore publik beserta shell dan batas Suspense URL query. */
export default function ExplorePageContent() {
  return (
    <PublicPageShell
      mainClassName="pt-20 m3-expanded:pt-24 m3-large:pt-28"
      showFooter
    >
      <Suspense fallback={null}>
        <Explore withHero />
      </Suspense>
    </PublicPageShell>
  );
}
