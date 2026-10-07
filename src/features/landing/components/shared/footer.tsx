"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useT } from "@/shared/providers/language-provider";
import { TextHoverEffect } from "@/shared/ui/text-hover-effect";

export function Footer() {
  const t = useT();

  return (
    <footer
      id="contacts"
      className="relative overflow-hidden bg-surface"
    >
      {/* Glow lembut di dasar footer, di belakang wordmark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-[radial-gradient(60%_70%_at_50%_100%,color-mix(in_oklab,var(--brand-primary)_14%,transparent),transparent)]"
      />

      <div className="container-site relative">
        {/* Footer Legal */}
        <div className="flex flex-col gap-2 border-t border-border-subtle pt-8 text-copy-secondary m3-medium:flex-row m3-medium:items-center m3-medium:justify-between">
          <p className="type-label">{t.footer.copyright}</p>
          <nav aria-label="Legal" className="flex items-center gap-3">
            {t.footer.legal.map((link, index) => (
              <Fragment key={link.href}>
                {index > 0 ? (
                  <span aria-hidden="true" className="size-1 rounded-full bg-copy-muted" />
                ) : null}
                <Link
                  className="inline-flex min-h-12 items-center rounded-[var(--radius-control)] type-label text-copy-secondary transition-colors hover:text-heading focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </Fragment>
            ))}
          </nav>
        </div>

        {/* Footer Wordmark: viewBox 420 x 100, huruf berada di y≈24–76.
            Margin negatif (persen dari lebar) memangkas ruang kosong di atas
            dan sedikit bagian bawah huruf agar terpotong di tepi footer. */}
        <div className="mt-4 overflow-hidden">
          <div className="-mt-[3.8%] -mb-[7.1%] aspect-[42/10] w-full">
            <TextHoverEffect label={t.hero.brand} text="PRIEMMAN" viewBoxWidth={420} />
          </div>
        </div>
      </div>
    </footer>
  );
}
