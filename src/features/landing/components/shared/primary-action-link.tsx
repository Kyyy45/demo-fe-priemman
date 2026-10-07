import type { ComponentProps } from "react";

import { ArrowDownRightIcon } from "@/shared/ui/icons";
import { cn } from "@/shared/lib/utils";

type PrimaryActionLinkProps = ComponentProps<"a"> & {
  size?: "compact" | "default";
};

/** Tombol utama untuk halaman public (landing, auth). */
export function PrimaryActionLink({
  children,
  className,
  size = "default",
  ...props
}: PrimaryActionLinkProps) {
  // Menentukan ukuran tombol dan icon dari variant size
  const compact = size === "compact";

  return (
    <a
      data-primary-action
      data-size={size}
      className={cn(
        "group relative inline-flex min-h-12 items-center rounded-[var(--radius-signature-action)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        className,
      )}
      {...props}
    >
      <span
        data-primary-action-surface
        className={cn(
          "inline-flex items-center rounded-[var(--radius-signature-action)] bg-brand text-action-ink transition-[background-color,transform] duration-200 group-hover:bg-brand-hover group-active:translate-y-px motion-reduce:transition-none",
          compact ? "h-10" : "h-12",
        )}
      >
        <span
          data-primary-action-label
          className={cn(
            "flex h-full min-w-0 items-center rounded-[var(--radius-signature-action)] bg-action-ink font-semibold whitespace-nowrap text-on-dark transition-colors duration-200 group-hover:bg-action-ink/90 dark:bg-heading dark:text-canvas dark:group-hover:bg-heading/90 motion-reduce:transition-none",
            compact ? "px-4 m3-label-large m3-large:px-[18px]" : "px-6 m3-label-large",
          )}
        >
          {children}
        </span>
        <ArrowDownRightIcon
          aria-hidden="true"
          data-primary-action-icon
          className={cn("shrink-0", compact ? "mx-3" : "mx-3.5")}
          size={compact ? 16 : 20}
        />
      </span>
    </a>
  );
}
