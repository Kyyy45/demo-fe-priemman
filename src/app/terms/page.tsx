import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Priemman",
  description: "Terms governing your use of Priemman.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-8 lg:py-24">
      <Link className="type-label text-copy-secondary hover:text-copy" href="/">← Back to Priemman</Link>
      <article className="mt-10 space-y-10">
        <header className="space-y-3"><p className="type-label text-copy-secondary">Last updated: September 25, 2026</p><h1 className="type-display font-semibold tracking-tight">Terms of Service</h1><p className="type-body-large text-copy-secondary">These Terms of Service govern your access to and use of the Priemman website and services.</p></header>
        <section className="space-y-4"><h2 className="type-section-title font-semibold">Using Priemman</h2><p className="type-body text-copy-secondary">You may use Priemman only in compliance with these terms and applicable law. You are responsible for keeping your account secure and for activity performed through your account. Information submitted to Priemman must be accurate and must not impersonate another person.</p></section>
        <section className="space-y-4"><h2 className="type-section-title font-semibold">Your content</h2><p className="type-body text-copy-secondary">You retain ownership of content you submit. You grant Priemman a limited, non-exclusive license to host, process, display, and distribute that content as necessary to operate the service and according to your visibility settings. You represent that you have the rights required to submit the content.</p></section>
        <section className="space-y-4"><h2 className="type-section-title font-semibold">Prohibited conduct</h2><ul className="list-disc space-y-2 pl-6 type-body text-copy-secondary"><li>Do not upload unlawful, infringing, malicious, deceptive, or abusive content.</li><li>Do not attempt to access another account, bypass security, or disrupt the service.</li><li>Do not use Priemman to distribute spam, malware, or unsolicited commercial messages.</li><li>Do not misuse public profiles, media, comments, or creator access workflows.</li></ul></section>
        <section className="space-y-4"><h2 className="type-section-title font-semibold">Creator access and third-party sign-in</h2><p className="type-body text-copy-secondary">Creator access is subject to review and may be approved, rejected, suspended, or revoked. Google and other identity providers authenticate accounts under their own terms. Priemman is not responsible for outages or policies of third-party services.</p></section>
        <section className="space-y-4"><h2 className="type-section-title font-semibold">Availability and termination</h2><p className="type-body text-copy-secondary">We may change, suspend, or discontinue parts of Priemman to maintain or improve the service. We may suspend or terminate access when these terms are violated, the account presents a security risk, or required by law. You may stop using Priemman at any time.</p></section>
        <section className="space-y-4"><h2 className="type-section-title font-semibold">Disclaimers and liability</h2><p className="type-body text-copy-secondary">Priemman is provided on an “as available” basis. To the extent permitted by law, Priemman disclaims warranties and will not be liable for indirect, incidental, special, or consequential losses arising from use of the service.</p></section>
        <section className="space-y-4"><h2 className="type-section-title font-semibold">Changes and contact</h2><p className="type-body text-copy-secondary">We may update these terms by publishing a revised version with a new effective date. Continued use after the effective date means you accept the revised terms. Questions can be sent through the <Link className="underline hover:text-copy" href="/contact">Contact</Link> page.</p></section>
      </article>
    </main>
  );
}
