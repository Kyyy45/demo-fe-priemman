"use client";

// Adapted from @cult-ui/pixel-heading-word. Perubahan: import `cn` dari
// project, ekspresi ternary-sebagai-pernyataan diubah ke if/else (lint), dan
// setup font Geist Pixel ada di globals.css (`--font-pixel-*`) + ErrorScreen.

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";

type PixelFont = "square" | "grid" | "circle" | "triangle" | "line";

const PIXEL_FONT_MAP: Record<PixelFont, string> = {
  square: "font-pixel-square",
  grid: "font-pixel-grid",
  circle: "font-pixel-circle",
  triangle: "font-pixel-triangle",
  line: "font-pixel-line",
};

const PIXEL_FONTS = Object.values(PIXEL_FONT_MAP);
const PIXEL_FONT_KEYS = Object.keys(PIXEL_FONT_MAP) as PixelFont[];

export interface PixelHeadingProps extends React.ComponentProps<"h1"> {
  /** Elemen yang dirender (heading, atau "p" bila teksnya bukan judul). */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  /** Font pixel saat diam. */
  initialFont?: PixelFont;
  /** Font saat hover/fokus (mode tukar). Tanpa ini, font berputar (mode siklus). */
  hoverFont?: PixelFont;
  /** Jeda antar-font pada mode siklus, dalam milidetik. */
  cycleInterval?: number;
  /** Indeks font awal (0–4); diabaikan bila `initialFont` diisi. */
  defaultFontIndex?: number;
  onFontIndexChange?: (index: number) => void;
  /** Tampilkan nama font di bawah heading. */
  showLabel?: boolean;
  /** Matikan semua interaksi hover/fokus. */
  disableHover?: boolean;
  /** Matikan perputaran otomatis pada mode siklus. */
  disableCycling?: boolean;
}

/** Heading yang menukar atau memutar gaya font pixel saat hover/fokus. */
export function PixelHeading({
  children,
  as: Tag = "h1",
  className,
  initialFont,
  hoverFont,
  cycleInterval = 300,
  defaultFontIndex = 0,
  onFontIndexChange,
  showLabel = false,
  disableHover = false,
  disableCycling = false,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}: PixelHeadingProps) {
  const resolvedDefaultIndex = initialFont
    ? PIXEL_FONT_KEYS.indexOf(initialFont)
    : defaultFontIndex;
  const hoverIndex = hoverFont ? PIXEL_FONT_KEYS.indexOf(hoverFont) : null;
  const isSwapMode = hoverIndex !== null;

  const [fontIndex, setFontIndex] = useState(resolvedDefaultIndex);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Versi asli memanggil onFontIndexChange DI DALAM updater setState, yang
  // dijalankan React saat render — bila callback itu meng-update state
  // komponen induk, React memberi error "Cannot update a component while
  // rendering a different component". Indeks berikutnya dihitung dari ref,
  // lalu state dan callback dipanggil terpisah di luar updater.
  const fontIndexRef = useRef(fontIndex);
  useEffect(() => {
    fontIndexRef.current = fontIndex;
  }, [fontIndex]);

  const advanceFont = useCallback(() => {
    const next = (fontIndexRef.current + 1) % PIXEL_FONTS.length;
    fontIndexRef.current = next;
    setFontIndex(next);
    onFontIndexChange?.(next);
  }, [onFontIndexChange]);

  const startCycling = useCallback(() => {
    setIsActive(true);
    intervalRef.current = setInterval(advanceFont, cycleInterval);
  }, [advanceFont, cycleInterval]);

  const stopCycling = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const swapToHover = useCallback(() => {
    if (hoverIndex === null) return;
    setIsActive(true);
    setFontIndex(hoverIndex);
    onFontIndexChange?.(hoverIndex);
  }, [hoverIndex, onFontIndexChange]);

  const swapToInitial = useCallback(() => {
    setIsActive(false);
    setFontIndex(resolvedDefaultIndex);
    onFontIndexChange?.(resolvedDefaultIndex);
  }, [resolvedDefaultIndex, onFontIndexChange]);

  const handleMouseEnter = (event: React.MouseEvent<HTMLHeadingElement>) => {
    if (!disableHover) {
      if (isSwapMode) swapToHover();
      else if (!disableCycling) startCycling();
    }
    onMouseEnter?.(event);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLHeadingElement>) => {
    if (!disableHover) {
      if (isSwapMode) swapToInitial();
      else stopCycling();
    }
    onMouseLeave?.(event);
  };

  const handleFocus = (event: React.FocusEvent<HTMLHeadingElement>) => {
    if (!disableHover) {
      if (isSwapMode) swapToHover();
      else setIsActive(true);
    }
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLHeadingElement>) => {
    if (!disableHover) {
      if (isSwapMode) swapToInitial();
      else setIsActive(false);
    }
    onBlur?.(event);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (!disableHover && !disableCycling) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!isSwapMode) advanceFont();
      }
    }
    onKeyDown?.(event);
  };

  const currentFontLabel = PIXEL_FONT_KEYS[fontIndex];

  return (
    <div
      className="inline-flex flex-col items-start gap-2"
      data-slot="pixel-heading"
    >
      <Tag
        className={cn(
          "cursor-default select-none transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          PIXEL_FONTS[fontIndex],
          className,
        )}
        data-font={currentFontLabel}
        data-state={isActive ? "active" : "idle"}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        tabIndex={0}
        {...props}
      >
        {children}
      </Tag>
      {showLabel ? (
        <output
          aria-live="polite"
          className={cn(
            "text-xs uppercase tracking-widest text-copy-muted transition-opacity duration-200",
            isActive ? "opacity-100" : "opacity-0",
          )}
          data-slot="pixel-heading-label"
        >
          {currentFontLabel}
        </output>
      ) : null}
    </div>
  );
}
