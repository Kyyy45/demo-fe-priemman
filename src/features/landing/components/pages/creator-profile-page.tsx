import { Suspense } from "react";

import { PublicCreatorProfileFromUrl } from "@/features/landing/components/creator-profile/public-creator-profile-from-url";
import { PublicPageShell } from "@/features/landing/components/shared/public-page-shell";
import { Skeleton } from "@/shared/ui/skeleton";

/** Halaman profil kreator publik, termasuk loading boundary untuk ID dari URL. */
export default function CreatorProfilePageContent() {
  return (
    <PublicPageShell showFooter>
      <div className="container-site min-w-0 pb-[var(--landing-section-gap)] pt-28 m3-expanded:pt-32 m3-large:pt-40">
        <Suspense fallback={<Skeleton className="h-[420px] w-full rounded-[var(--radius-feature)]" />}>
          <PublicCreatorProfileFromUrl />
        </Suspense>
      </div>
    </PublicPageShell>
  );
}
