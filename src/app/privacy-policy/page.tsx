import type { Metadata } from "next";

import { PublicPageShell } from "@/features/landing/components/shared/public-page-shell";
import { PrivacyPolicy } from "@/features/legal/components/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy Policy | Priemman",
  description: "How Priemman collects, uses, stores, shares, and protects your information, including Google user data.",
};

export default function PrivacyPolicyPage() {
  return (
    <PublicPageShell showFooter>
      <PrivacyPolicy />
    </PublicPageShell>
  );
}
