"use client";

import {
  GeistPixelCircle,
  GeistPixelGrid,
  GeistPixelLine,
  GeistPixelSquare,
  GeistPixelTriangle,
} from "geist/font/pixel";

import { cn } from "@/shared/lib/utils";
import { PixelHeading } from "@/shared/ui/pixel-heading-word";

const PIXEL_FONT_VARIABLES = [
  GeistPixelSquare.variable,
  GeistPixelGrid.variable,
  GeistPixelCircle.variable,
  GeistPixelTriangle.variable,
  GeistPixelLine.variable,
].join(" ");

// Kode 3 digit ("404", "500") tampil sebesar referensi; kata yang lebih
// panjang ("Offline", "Oops") dikecilkan supaya tetap muat di layar ponsel.
// leading ditulis SETELAH ukuran font di className: cn bekerja seperti
// tailwind-merge, dan ukuran font yang datang belakangan membuang leading
// sebelumnya (tinggi baris kembali 1.5 → jarak besar di bawah kode).
const CODE_CLASS = "font-normal tracking-tight";
const CODE_LEADING_CLASS = "leading-[0.85]";
const codeSizeClass = (code: string) =>
  code.length <= 3
    ? "text-[clamp(6.5rem,24vw,15rem)]"
    : "text-[clamp(3.5rem,15vw,10rem)]";

const BUTTON_CLASS =
  "inline-flex h-12 items-center justify-center rounded-full px-7 type-label font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

type ErrorAction =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never };

function ActionButton({
  action,
  variant,
}: {
  action: ErrorAction;
  variant: "primary" | "secondary";
}) {
  const className = cn(
    BUTTON_CLASS,
    variant === "primary"
      ? "bg-heading text-canvas hover:bg-heading/85"
      : "text-copy-secondary hover:bg-surface-muted hover:text-heading",
  );
  if (action.href) {
    // <a> biasa (bukan <Link>) untuk halaman error: navigasi penuh juga
    // memulihkan state aplikasi yang mungkin rusak penyebab error.
    return (
      <a className={className} href={action.href}>
        {action.label}
      </a>
    );
  }
  return (
    <button className={className} onClick={action.onClick} type="button">
      {action.label}
    </button>
  );
}

/**
 * Tampilan error layar penuh (404, error aplikasi, dashboard gagal dimuat).
 * Tanpa kartu/border: kode besar ber-font pixel, judul, penjelasan,
 * lalu tombol aksi — mengikuti referensi desain halaman 404.
 */
export function ErrorScreen({
  code,
  description,
  primaryAction,
  secondaryAction,
  title,
}: {
  code: string;
  description: string;
  primaryAction: ErrorAction;
  secondaryAction?: ErrorAction;
  title: string;
}) {
  return (
    <main
      className={cn(
        PIXEL_FONT_VARIABLES,
        "grid min-h-dvh place-items-center overflow-hidden bg-canvas px-[var(--page-gutter)] py-16 text-center",
      )}
    >
      <div className="flex max-w-3xl flex-col items-center">
        <PixelHeading
          as="p"
          className={cn(
            CODE_CLASS,
            codeSizeClass(code),
            CODE_LEADING_CLASS,
            "text-heading",
          )}
        >
          {code}
        </PixelHeading>

        <h1 className="mt-8 text-balance text-[clamp(1.5rem,3.6vw,2.5rem)] font-bold leading-tight tracking-tight text-heading">
          {title}
        </h1>
        <p className="mt-4 max-w-md text-balance type-body text-copy-secondary">
          {description}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <ActionButton action={primaryAction} variant="primary" />
          {secondaryAction ? (
            <ActionButton action={secondaryAction} variant="secondary" />
          ) : null}
        </div>
      </div>
    </main>
  );
}

