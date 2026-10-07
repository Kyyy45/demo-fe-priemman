"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useT } from "@/shared/providers/language-provider";
import { cn } from "@/shared/lib/utils";

export function ModeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useT();

  // Menunggu client siap agar theme tidak berbeda saat hydration (next-themes
  // hanya tahu tema asli setelah membaca localStorage di browser).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <span className={cn("inline-flex size-12 items-center justify-center", className)}>
      <button
        type="button"
        aria-label={t.nav.toggleTheme}
        title={t.nav.toggleTheme}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "group inline-flex size-12 items-center justify-center rounded-full bg-transparent transition-transform duration-200 active:translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand",
          !mounted && "opacity-0",
        )}
      >
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-transparent text-heading transition-colors duration-200 group-hover:bg-surface-muted group-focus-visible:bg-surface-muted">
          {isDark ? (
            <Sun aria-hidden="true" className="size-5" strokeWidth={2} />
          ) : (
            <Moon aria-hidden="true" className="size-5" strokeWidth={2} />
          )}
        </span>
      </button>
    </span>
  );
}
