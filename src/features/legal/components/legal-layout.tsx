"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { Language } from "@/shared/lib/translations";

export const SUPPORT_EMAIL = "support@priemman.my.id";

const COPY: Record<Language, { governing: string; updated: string }> = {
  en: {
    governing:
      "This document is available in English and Bahasa Indonesia. If there is any inconsistency between the two versions, the Bahasa Indonesia version prevails.",
    updated: "Last updated",
  },
  id: {
    governing:
      "Dokumen ini tersedia dalam Bahasa Indonesia dan Bahasa Inggris. Apabila terdapat perbedaan penafsiran antara kedua versi, versi Bahasa Indonesia yang berlaku.",
    updated: "Terakhir diperbarui",
  },
};

// Kerangka bersama halaman legal (Terms, Privacy Policy) di dalam
// PublicPageShell: container dan jarak atas sama dengan halaman landing
// lain (Contact); navigasi dan toggle bahasa sudah ada di navbar.
// Render server/awal selalu bahasa Inggris (default LanguageProvider), jadi
// reviewer dan crawler melihat versi Inggris di HTML statis.
export function LegalLayout({
  children,
  footer,
  intro,
  lang,
  title,
  updated,
}: {
  children: ReactNode;
  footer: ReactNode;
  intro: ReactNode;
  lang: Language;
  title: string;
  updated: string;
}) {
  const copy = COPY[lang];

  return (
    <div className="container-site min-w-0 pb-[var(--landing-section-gap)] pt-28 m3-expanded:pt-32 m3-large:pt-40" lang={lang}>
      <article className="space-y-10">
        <header className="space-y-3">
          <p className="type-label text-copy-secondary">
            {copy.updated}: {updated}
          </p>
          <h1 className="type-page-title font-heading">{title}</h1>
          <p className="type-body-large max-w-none text-copy-secondary">{intro}</p>
          <p className="rounded-[var(--radius-control)] border border-border-subtle bg-surface-muted/40 px-4 py-3 type-label text-copy-secondary">
            {copy.governing}
          </p>
        </header>
        {children}
        <footer className="border-t border-border-subtle pt-6 type-label text-copy-secondary">
          {footer}
        </footer>
      </article>
    </div>
  );
}

export function LegalSection({ children, id, title }: { children: ReactNode; id: string; title: string }) {
  return (
    <section className="scroll-mt-28 space-y-4" id={id}>
      <h2 className="type-section-title font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="type-body max-w-none text-copy-secondary">{children}</p>;
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6 type-body max-w-none text-copy-secondary">{children}</ul>;
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-copy">{children}</strong>;
}

export function ExternalLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <a className="underline hover:text-copy" href={href} rel="noreferrer" target="_blank">
      {children}
    </a>
  );
}

export function InternalLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link className="underline hover:text-copy" href={href}>
      {children}
    </Link>
  );
}

export function MailLink() {
  return (
    <a className="underline hover:text-copy" href={`mailto:${SUPPORT_EMAIL}`}>
      {SUPPORT_EMAIL}
    </a>
  );
}
