import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Footer } from "@/features/landing/components/shared/footer";
import { Navbar } from "@/features/landing/components/shared/navbar";
import { SiteFrame } from "@/shared/ui/site-frame";

type PublicPageShellProps = {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
  showFooter?: boolean;
};

/** Layout utama untuk halaman public (landing, explore, contact, dst.). */
export function PublicPageShell({
  children,
  className,
  mainClassName,
  showFooter = false,
}: PublicPageShellProps) {
  return (
    <div
      className={cn(
        "landing-shell min-h-dvh w-full max-w-full overflow-x-clip bg-canvas text-copy",
        className,
      )}
    >
      {/* Shared Navigation */}
      <SiteFrame />
      <Navbar />

      {/* Page Content */}
      <div className="min-h-dvh w-full min-w-0 max-w-full overflow-x-clip bg-surface">
        <main className={cn("w-full min-w-0 max-w-full", mainClassName)}>
          {children}
        </main>
        {showFooter ? <Footer /> : null}
      </div>
    </div>
  );
}
