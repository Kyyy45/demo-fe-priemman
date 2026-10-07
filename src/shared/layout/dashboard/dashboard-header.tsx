"use client";

import { SidebarTrigger } from "@/shared/ui/sidebar";
import { ModeToggle } from "@/shared/ui/mode-toggle";
import { LanguageToggle } from "@/shared/ui/language-toggle";
import { Separator } from "@/shared/ui/separator";
import { useT } from "@/shared/providers/language-provider";
import { NavUser } from "./nav-user";

export function DashboardHeader({
  activeChild,
  activeParent,
  user,
  onAccountClick,
}: {
  activeChild: string | null;
  activeParent: string;
  user: { name: string; email: string; avatar: string };
  onAccountClick: () => void;
}) {
  const t = useT();
  const pageTitle = activeChild ?? activeParent;
  return (
    <header className="flex h-[var(--dashboard-header-height)] shrink-0 items-center justify-between gap-[var(--dashboard-header-action-gap)] rounded-[var(--radius-control)] border border-border-subtle bg-surface-container-low px-[var(--dashboard-header-padding)]">
      {/* Navigasi ada di sidebar; header hanya menampilkan konteks dan aksi akun yang tersedia. */}
      <div className="flex min-w-0 items-center gap-[var(--dashboard-header-action-gap)]">
        <SidebarTrigger className="-ml-1 !size-10 !min-h-10 cursor-pointer" />
        <Separator orientation="vertical" className="h-4 !self-center" />
        <p className="dashboard-card-title hidden truncate m3-medium:block">
          {pageTitle || t.dashboardUser.overview.profileSpotlight}
        </p>
      </div>
      {/* Display Settings dan menu akun berada dalam satu action cluster di ujung kanan. */}
      <div className="flex shrink-0 items-center gap-0">
        <LanguageToggle className="!size-10 max-[425px]:hidden [&>span]:!size-8" />
        <div className="flex items-center gap-1">
          <ModeToggle className="!size-10 [&>button]:!size-10 [&>button>span]:!size-8" />
          <NavUser
            onAccountClick={onAccountClick}
            placement="header"
            user={user}
          />
        </div>
      </div>
    </header>
  );
}
