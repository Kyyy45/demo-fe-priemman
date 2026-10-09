"use client";

// Adapted from @react-bits/TextLoop (varian TS + Tailwind dari komponen yang
// sama dengan TextLoop-JS-CSS). Perubahan untuk Priemman:
// - gsap diambil dari "@/shared/lib/gsap" (paket yang sudah ada di project);
// - warna pita/teks dipasang lewat `style`, jadi token CSS seperti
//   "var(--brand-primary)" bisa dipakai (atribut SVG tidak menerima var());
// - `viewHeight` bisa diatur supaya bentuk "wave" yang landai tidak
//   menyisakan ruang kosong vertikal yang besar;
// - `svgClassName` untuk melebarkan SVG di layar sempit agar teks tetap besar;
// - `label` sebagai teks aksesibel (teks berjalan sendiri aria-hidden).

import {
  type CSSProperties,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { gsap } from "@/shared/lib/gsap";
import { cn } from "@/shared/lib/utils";

export type TextLoopShape = "wave" | "circle" | "infinity" | "arch" | "line";
export type TextLoopDirection = "forward" | "reverse";

export interface TextLoopProps {
  text?: string;
  label?: string;
  shape?: TextLoopShape;
  path?: string;
  speed?: number;
  direction?: TextLoopDirection;
  separator?: string;
  curviness?: number;
  fontSize?: number;
  fontWeight?: number | string;
  letterSpacing?: number;
  uppercase?: boolean;
  color?: string;
  ribbon?: boolean;
  ribbonColor?: string;
  ribbonWidth?: number;
  pauseOnHover?: boolean;
  viewHeight?: number;
  className?: string;
  svgClassName?: string;
  style?: CSSProperties;
}

interface Metrics {
  length: number;
  reps: number;
}

const VIEW_W = 1200;
const EDGE_PAD = 6;

const buildPath = (
  shape: TextLoopShape,
  curviness: number,
  ribbonWidth: number,
  viewHeight: number,
): string => {
  const cx = VIEW_W / 2;
  const cy = viewHeight / 2;
  const c = Math.max(0, curviness);
  const room = Math.max(20, cy - Math.max(0, ribbonWidth) / 2 - EDGE_PAD);

  switch (shape) {
    case "circle": {
      const r = Math.min(90 + c * 0.95, room);
      return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
    }
    case "infinity": {
      const r = 150 + c * 1.4;
      const h = Math.min(60 + c * 0.95, room);
      return [
        `M ${cx} ${cy}`,
        `C ${cx + r * 0.55} ${cy - h} ${cx + r} ${cy - h} ${cx + r} ${cy}`,
        `C ${cx + r} ${cy + h} ${cx + r * 0.55} ${cy + h} ${cx} ${cy}`,
        `C ${cx - r * 0.55} ${cy - h} ${cx - r} ${cy - h} ${cx - r} ${cy}`,
        `C ${cx - r} ${cy + h} ${cx - r * 0.55} ${cy + h} ${cx} ${cy}`,
        "Z",
      ].join(" ");
    }
    case "arch": {
      const rise = Math.min(120 + c * 1.1, room * 2);
      return `M 120 ${cy + rise / 2} Q ${cx} ${cy - rise * 1.5} ${VIEW_W - 120} ${cy + rise / 2}`;
    }
    case "line":
      return `M -320 ${cy} L ${VIEW_W + 320} ${cy}`;
    case "wave":
    default: {
      const a = Math.min(c * 2.2, room * 2);
      return `M -320 ${cy} Q -160 ${cy - a} 0 ${cy} T 320 ${cy} T 640 ${cy} T 960 ${cy} T 1280 ${cy} T ${VIEW_W + 320} ${cy}`;
    }
  }
};

export function TextLoop({
  text = "React ✦ Bits",
  label,
  shape = "wave",
  path,
  speed = 90,
  direction = "forward",
  separator = "✦",
  curviness = 90,
  fontSize = 46,
  fontWeight = 800,
  letterSpacing = 2,
  uppercase = true,
  color = "#ffffff",
  ribbon = true,
  ribbonColor = "#5227FF",
  ribbonWidth = 86,
  pauseOnHover = true,
  viewHeight = 520,
  className,
  svgClassName,
  style,
}: TextLoopProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const measureRef = useRef<SVGTextElement | null>(null);
  const headRef = useRef<SVGTextPathElement | null>(null);
  const tailRef = useRef<SVGTextPathElement | null>(null);

  const [metrics, setMetrics] = useState<Metrics>({ length: 0, reps: 1 });

  const rawId = useId();
  const pathId = `text-loop-${rawId.replace(/:/g, "")}`;

  const d = useMemo(
    () => path || buildPath(shape, curviness, ribbonWidth, viewHeight),
    [path, shape, curviness, ribbonWidth, viewHeight],
  );

  const unit = useMemo(() => {
    const base = uppercase ? String(text).toUpperCase() : String(text);
    const gap = separator ? ` ${separator} ` : "   ";
    return `${base}${gap}`;
  }, [text, separator, uppercase]);

  const textStyle = useMemo<CSSProperties>(
    () => ({
      fill: color,
      fontSize: `${fontSize}px`,
      fontWeight,
      letterSpacing: `${letterSpacing}px`,
    }),
    [color, fontSize, fontWeight, letterSpacing],
  );

  useLayoutEffect(() => {
    const pathEl = pathRef.current;
    const measureEl = measureRef.current;
    if (!pathEl || !measureEl) return undefined;

    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      let length = 0;
      let unitWidth = 0;
      try {
        length = pathEl.getTotalLength();
        unitWidth = measureEl.getComputedTextLength();
      } catch {
        return;
      }
      if (!length) return;

      const reps =
        unitWidth > 0 ? Math.max(1, Math.round(length / unitWidth)) : 1;
      setMetrics((prev) =>
        prev.length === length && prev.reps === reps
          ? prev
          : { length, reps },
      );
    };

    measure();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    // Saat pertama dirender di dalam konten yang masih tersembunyi (mis.
    // streaming Suspense), lebar teks terukur 0 → teks diregangkan sepanjang
    // path. Ukur ulang begitu elemen benar-benar punya ukuran.
    const root = rootRef.current;
    const observer =
      root && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    if (root) observer?.observe(root);

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [d, unit, fontSize, fontWeight, letterSpacing]);

  useEffect(() => {
    const { length } = metrics;
    const head = headRef.current;
    const tail = tailRef.current;
    if (!head || !tail || !length) return undefined;

    const apply = (offset: number) => {
      const partner = offset >= 0 ? offset - length : offset + length;
      head.setAttribute("startOffset", String(offset));
      tail.setAttribute("startOffset", String(partner));
    };

    apply(0);

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || speed <= 0) return undefined;

    const state = { offset: 0 };
    const tween = gsap.to(state, {
      offset: direction === "reverse" ? -length : length,
      duration: length / speed,
      ease: "none",
      repeat: -1,
      onUpdate: () => apply(state.offset),
    });

    const root = rootRef.current;
    const pause = () => tween.pause();
    const resume = () => tween.resume();

    if (pauseOnHover && root) {
      root.addEventListener("pointerenter", pause);
      root.addEventListener("pointerleave", resume);
    }

    return () => {
      tween.kill();
      if (pauseOnHover && root) {
        root.removeEventListener("pointerenter", pause);
        root.removeEventListener("pointerleave", resume);
      }
    };
  }, [metrics, speed, direction, pauseOnHover]);

  const loopText = unit.repeat(metrics.reps);
  const fitLength = metrics.length || undefined;

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      ref={rootRef}
      style={style}
    >
      <svg
        aria-label={label ?? text}
        className={cn("block h-auto w-full", svgClassName)}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        viewBox={`0 0 ${VIEW_W} ${viewHeight}`}
      >
        <path
          d={d}
          fill="none"
          id={pathId}
          ref={pathRef}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            stroke: ribbon ? ribbonColor : "none",
            strokeWidth: ribbon ? ribbonWidth : 0,
          }}
        />

        <text
          aria-hidden="true"
          className="pointer-events-none invisible"
          ref={measureRef}
          style={textStyle}
        >
          {unit}
        </text>

        <text
          aria-hidden="true"
          className="select-none"
          dominantBaseline="central"
          lengthAdjust="spacing"
          style={textStyle}
          textLength={fitLength}
        >
          <textPath href={`#${pathId}`} ref={headRef} startOffset={0}>
            {loopText}
          </textPath>
        </text>

        <text
          aria-hidden="true"
          className="select-none"
          dominantBaseline="central"
          lengthAdjust="spacing"
          style={textStyle}
          textLength={fitLength}
        >
          <textPath href={`#${pathId}`} ref={tailRef} startOffset={0}>
            {loopText}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
