"use client";

import { EnvelopeSimple, GithubLogo, InstagramLogo } from "@phosphor-icons/react/dist/ssr";

import { PublicPageShell } from "@/features/landing/components/shared/public-page-shell";
import { useT } from "@/shared/providers/language-provider";

const contactMethods = [
  { labelKey: "email" as const, value: "support@priemman.my.id", href: "mailto:support@priemman.my.id", icon: EnvelopeSimple },
  { labelKey: "instagram" as const, value: "Priemman", href: "#", icon: InstagramLogo },
  { labelKey: "github" as const, value: "Priemman", href: "#", icon: GithubLogo },
];

/** Konten dan perilaku halaman kontak publik. */
export default function ContactPageContent() {
  const t = useT();
  const contacts = contactMethods.map((contact) => ({ ...contact, label: t.contact[contact.labelKey] }));

  return (
    <PublicPageShell showFooter>
      <div className="container-site min-w-0 pb-[var(--landing-section-gap)] pt-28 m3-expanded:pt-32 m3-large:pt-40">
        <section className="min-w-0 max-w-3xl">
          <h1 className="type-page-title font-heading">{t.contact.title}</h1>
          <p className="type-body mt-5 max-w-2xl">{t.contact.description}</p>
        </section>

        <section className="mt-10 grid min-w-0 gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-expanded:mt-12 m3-large:grid-cols-3">
          {contacts.map((contact) => (
            <a
              key={contact.label}
              href={contact.href}
              className="group min-w-0 min-h-48 rounded-[var(--radius-card)] border border-border-subtle bg-surface-raised p-[var(--card-padding)] text-copy shadow-[var(--shadow-card)] transition-[border-color,transform] hover:-translate-y-0.5 hover:border-border-strong focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <contact.icon className="size-6 text-heading" weight="fill" />
              <div className="mt-8 type-label text-copy-muted">{contact.label}</div>
              <div className="mt-1 break-words type-card-title text-heading">{contact.value}</div>
            </a>
          ))}
        </section>
      </div>
    </PublicPageShell>
  );
}
