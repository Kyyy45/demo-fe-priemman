"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { GlobalSkeleton } from "@/shared/components/global-skeleton";
import { cn } from "@/shared/lib/utils";

export function GlobalUiReveal({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [revealed, setRevealed] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Menjalankan transisi skeleton setelah browser selesai membuat frame pertama
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setRevealed(true));
    const timeout = window.setTimeout(() => setShowSkeleton(false), 450);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <div className={cn("global-ui-reveal t-skel min-h-dvh", revealed && "is-revealed")}>
      {showSkeleton ? (
        <div aria-hidden={revealed} className="t-skel-skeleton is-pulsing">
          <GlobalSkeleton pathname={pathname} />
        </div>
      ) : null}
      <div aria-hidden={!revealed} className="t-skel-content">
        {children}
      </div>
    </div>
  );
}
