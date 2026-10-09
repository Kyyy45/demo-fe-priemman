"use client";

// Adapted from @cult-ui/mac-screen. Perubahan untuk Priemman: isi layar
// berupa `children` (tampilan HTML sendiri), bukan GIF dari Giphy, dan bingkai
// memakai next/image dari aset lokal /component-frames/apple-computer-img.png
// (1365 × 768, diunduh dari cult-ui).
import type { ReactNode } from "react";
import Image from "next/image";

import { cn } from "@/shared/lib/utils";

interface MacScreenProps {
  children?: ReactNode;
  className?: string;
  /** Teks alternatif untuk bingkai komputer. */
  alt?: string;
  /** Kelas untuk gambar bingkai, mis. "h-full w-auto" untuk mengikuti tinggi. */
  imageClassName?: string;
}

export function MacScreen({
  alt = "Classic Macintosh computer",
  children,
  className,
  imageClassName = "h-auto w-full",
}: MacScreenProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      <Image
        alt={alt}
        className={imageClassName}
        height={768}
        src="/component-frames/apple-computer-img.png"
        width={1365}
      />

      {/* Area layar — semua dalam persen supaya mengikuti ukuran bingkai. */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: "22.27%",
          left: "35.6%",
          width: "28.79%",
          height: "37.89%",
          borderRadius: "2.5%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
