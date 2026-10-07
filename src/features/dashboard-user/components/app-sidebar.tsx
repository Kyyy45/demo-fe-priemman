"use client";

import Link from "next/link";
import { Bookmark, Heart, LayoutDashboard } from "lucide-react";

import { LogoMark } from "@/shared/ui/logo-mark";
import { NavMain, type NavItem } from "@/shared/layout/dashboard/nav-main";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";

const navData: NavItem[] = [
  { label: "Workspace", isSection: true },
  { title: "Dashboard", icon: LayoutDashboard },
  {
    title: "Library",
    icon: Bookmark,
    children: [
      { title: "Liked", icon: Heart },
      { title: "Saved", icon: Bookmark },
    ],
  },
];

// 1. Sidebar User mempertahankan anatomy raw sidebar-07 tanpa data contoh Shadcn.
export function AppSidebar({
  activeParent,
  activeChild,
  setActiveParent,
  setActiveChild,
}: {
  activeParent: string;
  activeChild: string | null;
  setActiveParent: (value: string) => void;
  setActiveChild: (value: string | null) => void;
  user: { name: string; email: string; avatar: string };
}) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              data-dashboard-sidebar-brand
              className="flex h-[var(--dashboard-menu-height)] w-full items-center gap-3 rounded-[var(--radius-control)] px-3 text-heading transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0"
              href="/"
            >
              <LogoMark className="size-7 shrink-0" />
              <span className="dashboard-logo-wordmark dashboard-card-title truncate group-data-[collapsible=icon]:hidden">
                Priemman
              </span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full touch-pan-y overscroll-contain">
          <div className="px-3">
            <NavMain
              activeChild={activeChild}
              activeParent={activeParent}
              items={navData}
              setActiveChild={setActiveChild}
              setActiveParent={setActiveParent}
            />
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
