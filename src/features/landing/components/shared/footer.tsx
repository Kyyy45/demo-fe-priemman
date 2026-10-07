"use client";

import Link from "next/link";
import { LogoMark } from "@/shared/ui/logo-mark";
import { useT } from "@/shared/providers/language-provider";

// Logo brand GitHub/Instagram digambar manual: versi lucide-react yang dipakai
// project ini sudah tidak menyertakan ikon logo pihak ketiga (brand icons).
function GithubGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.36 1.08 2.94.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.35 4.68-4.58 4.93.36.31.68.92.68 1.85v2.75c0 .26.18.57.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

function InstagramGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Priemman belum punya URL social resmi; tombol dibuat disabled (bukan dihapus)
// supaya posisi/layout tetap dan tim bisa isi href begitu akunnya siap.
const SOCIALS = [
  { label: "Instagram", icon: InstagramGlyph },
  { label: "GitHub", icon: GithubGlyph },
];

export function Footer() {
  const t = useT();

  return (
    <footer id="contacts" className="border-t border-border-subtle bg-surface">
      <div className="container-site py-16 m3-medium:py-24">
        <div className="grid min-w-0 gap-12 m3-large:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] m3-large:gap-20">
          {/* Footer Brand */}
          <div className="min-w-0">
            <Link
              href="/"
              className="flex min-h-12 w-fit items-center gap-2.5 rounded-[var(--radius-control)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
            >
              <LogoMark className="h-7 w-7" />
              <span className="font-heading type-card-title tracking-tight text-heading">
                {t.hero.brand}
              </span>
            </Link>
            <p className="mt-5 max-w-xs type-label text-copy-secondary">{t.footer.tagline}</p>
            <div className="mt-7 flex items-center gap-2">
              {SOCIALS.map((social) => (
                <button
                  aria-disabled="true"
                  disabled
                  key={social.label}
                  aria-label={social.label}
                  className="flex size-12 cursor-not-allowed items-center justify-center rounded-full border border-border-subtle bg-surface-muted text-copy-disabled shadow-[var(--shadow-control)]"
                  type="button"
                >
                  <social.icon className="size-4.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          <div className="grid min-w-0 grid-cols-2 gap-10 m3-medium:grid-cols-3">
            {t.footer.columns.map((column) => (
              <div className="min-w-0" key={column.title}>
                <h3 className="type-label font-semibold text-heading">{column.title}</h3>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.href === "#" ? (
                        <span aria-disabled="true" className="cursor-not-allowed type-label text-copy-disabled">
                          {link.label}
                        </span>
                      ) : (
                        <a
                          href={link.href}
                          className="inline-flex min-h-12 min-w-12 items-center rounded-[var(--radius-control)] type-label text-copy-secondary transition-colors hover:text-heading focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Legal */}
        <div className="mt-14 flex flex-col gap-4 border-t border-border-subtle pt-6 text-copy-secondary m3-medium:flex-row m3-medium:items-center m3-medium:justify-between">
          <p className="type-label">{t.footer.copyright}</p>
          <div className="flex items-center gap-6">
            {t.footer.legal.map((link) => (
              <span aria-disabled="true" className="cursor-not-allowed type-label text-copy-disabled" key={link.label}>
                {link.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
