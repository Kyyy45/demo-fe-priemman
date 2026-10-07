import type { ReactNode } from "react";
import Link from "next/link";

import { LogoMark } from "@/shared/ui/logo-mark";
import { SiteFrame } from "@/shared/ui/site-frame";

import { PreviewCard } from "./preview-card";

interface AuthShellProps {
  heading: ReactNode;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  previewAlt?: string;
}

export function AuthShell({
  heading,
  subtitle,
  children,
  footer,
  actions,
  previewAlt,
}: AuthShellProps) {
  return (
    // bg-surface (bukan bg-canvas) supaya konsisten dengan halaman public lain
    // (PublicPageShell merender konten di atas bg-surface juga) — placeholder
    // bg-surface-container-high di PreviewCard jadi terlihat sama di sini
    // seperti di mosaic About, bukan menyatu dengan background seperti sebelumnya.
    <div className="relative min-h-[100dvh] overflow-x-clip bg-surface text-copy">
      <SiteFrame />

      {/* 1. Brand dan kontrol global: tidak mengubah logic endpoint Auth. */}
      <div className="absolute inset-x-4 top-4 z-20 flex min-h-12 items-center justify-between gap-4 m3-medium:inset-x-6 m3-medium:top-5 m3-large:inset-x-10 m3-large:top-8">
        <Link
          href="/"
          className="flex min-h-12 items-center gap-1.5 rounded-[var(--radius-control)] px-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand m3-medium:gap-2.5"
        >
          <LogoMark className="size-7 object-contain m3-medium:size-8" />
          <span className="font-heading m3-title-large text-heading">
            Priemman
          </span>
        </Link>
        {actions ? (
          <div className="flex shrink-0 items-center gap-1.5 m3-medium:gap-2">
            {actions}
          </div>
        ) : null}
      </div>

      {/* 2. Layout utama memisahkan slot form interaktif dari preview dekoratif. */}
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[1440px] flex-col items-center justify-center gap-8 m3-large:grid m3-large:grid-cols-2 m3-large:gap-[var(--grid-gap)] m3-large:px-[var(--page-gutter)]">
        {/* 3. LoginPage memasukkan UI endpoint send-otp dan verify-otp pada slot ini. */}
        <section className="flex w-full items-center justify-center px-4 pb-8 pt-28 m3-medium:px-8 m3-medium:pb-10 m3-medium:pt-32 m3-large:px-0 m3-large:py-24">
          <div className="flex w-full max-w-md flex-col items-center gap-6 m3-medium:gap-8">
            <header className="flex w-full max-w-md flex-col items-center gap-3">
              <h1 className="m-0 max-w-[18ch] select-none text-center m3-headline-large text-balance">
                {heading}
              </h1>
              <p className="m-0 max-w-[36ch] text-center type-body text-copy-secondary">
                {subtitle}
              </p>
            </header>

            <div className="flex w-full flex-col items-center gap-3">
              <div className="w-full max-w-md rounded-[var(--radius-card)] border border-border-subtle bg-surface-raised p-3 text-center shadow-[var(--shadow-card)] min-[390px]:p-4 m3-medium:p-6">
                {children}
              </div>
              {footer}
            </div>
          </div>
        </section>

        {/* 4. Preview hanya visual; tidak menyimpan data Auth atau memanggil API. */}
        <section className="hidden min-w-0 items-center justify-center m3-large:flex m3-large:pb-8 m3-large:pt-24">
          <div className="relative aspect-[7/8] max-h-[calc(100dvh-12rem)] w-full max-w-[35rem] overflow-hidden rounded-[var(--radius-card)]">
            <div className="absolute inset-0" aria-hidden="true">
              <PreviewCard alt={previewAlt} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
