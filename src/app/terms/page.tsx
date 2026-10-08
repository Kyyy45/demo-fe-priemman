import type { Metadata } from "next";

import { PublicPageShell } from "@/features/landing/components/shared/public-page-shell";
import { TermsOfService } from "@/features/legal/components/terms-of-service";

export const metadata: Metadata = {
  title: "Terms of Service | Priemman",
  description: "Terms governing your use of Priemman.",
};

export default function TermsPage() {
  return (
    <PublicPageShell showFooter>
      <TermsOfService />
    </PublicPageShell>
  );
}
