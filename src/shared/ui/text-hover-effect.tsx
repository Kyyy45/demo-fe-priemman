"use client";

import { useId, useRef, useState } from "react";
import { motion } from "motion/react";

// Adapted from @aceternity/text-hover-effect. Perubahan: id gradient/mask
// unik per instance (useId), posisi mask dihitung langsung di onMouseMove,
// garis tepi digambar saat masuk viewport (bukan saat mount), dan lebar
// viewBox bisa diatur agar teks panjang seperti "PRIEMMAN" tidak terpotong.
export function TextHoverEffect({
  text,
  duration,
  viewBoxWidth = 300,
  label,
}: {
  text: string;
  duration?: number;
  /** Lebar viewBox (tinggi tetap 100); perbesar untuk teks yang lebih panjang. */
  viewBoxWidth?: number;
  label?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });
  const id = useId().replace(/:/g, "");
  const gradientId = `text-gradient-${id}`;
  const revealId = `reveal-mask-${id}`;
  const maskId = `text-mask-${id}`;

  const moveMask = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect.height) return;
    setMaskPosition({
      cx: `${((clientX - rect.left) / rect.width) * 100}%`,
      cy: `${((clientY - rect.top) / rect.height) * 100}%`,
    });
  };

  return (
    <svg
      aria-label={label ?? text}
      className="select-none"
      height="100%"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(event) => moveMask(event.clientX, event.clientY)}
      ref={svgRef}
      role="img"
      viewBox={`0 0 ${viewBoxWidth} 100`}
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse">
          {hovered && (
            <>
              <stop offset="0%" stopColor="#eab308" />
              <stop offset="25%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="75%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </>
          )}
        </linearGradient>

        <motion.radialGradient
          animate={maskPosition}
          gradientUnits="userSpaceOnUse"
          id={revealId}
          initial={{ cx: "50%", cy: "50%" }}
          r="20%"
          transition={{ duration: duration ?? 0, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id={maskId}>
          <rect
            fill={`url(#${revealId})`}
            height="100%"
            width="100%"
            x="0"
            y="0"
          />
        </mask>
      </defs>
      <text
        className="fill-transparent stroke-border-strong font-[helvetica] text-7xl font-bold"
        dominantBaseline="middle"
        strokeWidth="0.3"
        style={{ opacity: hovered ? 0.7 : 0 }}
        textAnchor="middle"
        x="50%"
        y="50%"
      >
        {text}
      </text>
      <motion.text
        className="fill-transparent stroke-border-strong font-[helvetica] text-7xl font-bold"
        dominantBaseline="middle"
        initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
        strokeWidth="0.3"
        textAnchor="middle"
        transition={{ duration: 4, ease: "easeInOut" }}
        viewport={{ once: true, amount: 0.4 }}
        whileInView={{ strokeDashoffset: 0, strokeDasharray: 1000 }}
        x="50%"
        y="50%"
      >
        {text}
      </motion.text>
      <text
        className="fill-transparent font-[helvetica] text-7xl font-bold"
        dominantBaseline="middle"
        mask={`url(#${maskId})`}
        stroke={`url(#${gradientId})`}
        strokeWidth="0.3"
        textAnchor="middle"
        x="50%"
        y="50%"
      >
        {text}
      </text>
    </svg>
  );
}
