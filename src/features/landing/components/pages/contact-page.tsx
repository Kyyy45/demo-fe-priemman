"use client";

import {
  ArrowUpRight,
  Handshake,
  InstagramLogo,
  Lifebuoy,
} from "@phosphor-icons/react/dist/ssr";

import { PublicPageShell } from "@/features/landing/components/shared/public-page-shell";
import { useT } from "@/shared/providers/language-provider";

// Kanal kontak resmi Priemman. `value` ditampilkan apa adanya sebagai teks
// tautan supaya alamat/handle bisa dibaca dan disalin langsung.
const CONTACT_CHANNELS = [
  {
    key: "partnerships",
    icon: Handshake,
    value: "admin@priemman.my.id",
    href: "mailto:admin@priemman.my.id",
    external: false,
  },
  {
    key: "support",
    icon: Lifebuoy,
    value: "support@priemman.my.id",
    href: "mailto:support@priemman.my.id",
    external: false,
  },
  {
    key: "instagram",
    icon: InstagramLogo,
    value: "@priemman_",
    href: "https://www.instagram.com/priemman_/",
    external: true,
  },
] as const;

/** Konten dan perilaku halaman kontak publik. */
export default function ContactPageContent() {
  const t = useT();

  return (
    <PublicPageShell showFooter>
      <div className="container-site min-w-0 pb-[var(--landing-section-gap)] pt-28 m3-expanded:pt-32 m3-large:pt-40">
        <section className="min-w-0 max-w-4xl">
          <h1 className="type-page-title font-heading">{t.contact.title}</h1>
          <p className="type-body-large mt-5 max-w-2xl text-copy-secondary">
            {t.contact.description}
          </p>
        </section>

        <section className="mt-12 grid min-w-0 gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-expanded:mt-16 m3-large:grid-cols-3">
          {CONTACT_CHANNELS.map((channel) => {
            const copy = t.contact[channel.key];
            return (
              <a
                className="group flex min-w-0 flex-col rounded-[var(--radius-card)] border border-border-subtle bg-surface-raised p-[var(--card-padding)] text-copy transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                href={channel.href}
                key={channel.key}
                {...(channel.external
                  ? { rel: "noopener noreferrer", target: "_blank" }
                  : {})}
              >
                <span className="flex size-12 items-center justify-center rounded-[var(--radius-control)] bg-brand text-on-brand">
                  <channel.icon className="size-6" />
                </span>
                <h2 className="mt-5 type-card-title font-semibold text-heading">
                  {copy.title}
                </h2>
                <p className="mt-3 type-body text-copy-secondary">
                  {copy.description}
                </p>
                <span className="mt-auto flex items-center gap-1.5 break-all pt-6 type-label font-semibold text-heading">
                  {channel.value}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    weight="bold"
                  />
                </span>
              </a>
            );
          })}
        </section>
      </div>
    </PublicPageShell>
  );
}
