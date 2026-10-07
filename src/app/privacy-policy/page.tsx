import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Priemman",
  description: "How Priemman collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-8 lg:py-24">
      <Link className="type-label text-copy-secondary hover:text-copy" href="/">
        ← Back to Priemman
      </Link>
      <article className="mt-10 space-y-10">
        <header className="space-y-3">
          <p className="type-label text-copy-secondary">Last updated: September 25, 2026</p>
          <h1 className="type-display font-semibold tracking-tight">Privacy Policy</h1>
          <p className="type-body-large text-copy-secondary">
            This Privacy Policy explains how Priemman collects, uses, stores, and protects information when you use our website and services.
          </p>
        </header>

        <section className="space-y-4"><h2 className="type-section-title font-semibold">Information we collect</h2><p className="type-body text-copy-secondary">We collect information you provide when you create an account, complete your profile, publish projects, contact us, or request creator access. This may include your name, email address, profile details, avatar, projects, media, connected accounts, and workspace activity.</p><p className="type-body text-copy-secondary">If you sign in with Google, we receive the basic account information permitted by Google, such as your name, email address, profile image, and account identifier. We do not request or use Google data beyond what is needed to authenticate and provide Priemman features.</p></section>
        <section className="space-y-4"><h2 className="type-section-title font-semibold">How we use information</h2><ul className="list-disc space-y-2 pl-6 type-body text-copy-secondary"><li>To authenticate you and maintain your account.</li><li>To display your profile and published projects according to your visibility settings.</li><li>To provide project publishing, media upload, collections, creator access, and workspace features.</li><li>To communicate service notices, security alerts, and support responses.</li><li>To protect the service, prevent abuse, and comply with legal obligations.</li></ul></section>
        <section className="space-y-4"><h2 className="type-section-title font-semibold">Sharing and retention</h2><p className="type-body text-copy-secondary">We do not sell your personal information. We share information only with service providers that help us operate Priemman, when required by law, or when you choose to make content public. We retain information for as long as needed to provide the service, meet legal obligations, resolve disputes, and enforce agreements.</p></section>
        <section className="space-y-4"><h2 className="type-section-title font-semibold">Security</h2><p className="type-body text-copy-secondary">We use reasonable technical and organizational safeguards to protect account and project data. No internet service can guarantee absolute security, so please protect your credentials and contact us promptly if you believe your account is compromised.</p></section>
        <section className="space-y-4"><h2 className="type-section-title font-semibold">Your choices and rights</h2><p className="type-body text-copy-secondary">You may review or update profile information in your account settings and may request access, correction, export, or deletion of personal information subject to applicable law. Public content can be managed through its visibility settings. To make a privacy request, contact us through the Priemman contact page.</p></section>
        <section className="space-y-4"><h2 className="type-section-title font-semibold">Children and changes</h2><p className="type-body text-copy-secondary">Priemman is not intended for children who are not permitted to use online services under applicable law. We may update this policy from time to time and will publish the updated date on this page.</p></section>
        <footer className="border-t border-border-subtle pt-6 type-label text-copy-secondary">Questions about privacy? Visit <Link className="underline hover:text-copy" href="/contact">Contact</Link>.</footer>
      </article>
    </main>
  );
}
