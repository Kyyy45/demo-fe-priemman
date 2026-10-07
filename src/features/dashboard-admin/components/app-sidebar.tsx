"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { LogoMark } from "@/shared/ui/logo-mark";
import { NavMain, type NavItem } from "@/shared/layout/dashboard/nav-main";
import { NavUser } from "@/shared/layout/dashboard/nav-user";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";

const navData: NavItem[] = [
  { label: "Overview", isSection: true },
  { title: "Dashboard", icon: LayoutDashboard },
];

export function AppSidebar({
  activeParent,
  activeChild,
  setActiveParent,
  setActiveChild,
  user,
}: {
  activeParent: string;
  activeChild: string | null;
  setActiveParent: (val: string) => void;
  setActiveChild: (val: string | null) => void;
  user: { name: string; email: string; avatar: string };
}) {
  return (
    <Sidebar collapsible="icon">
      <div className="dashboard-manrope flex h-full min-h-0 flex-col overflow-hidden">
        {/* Sidebar Brand */}
        <SidebarHeader className="shrink-0 p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link
                data-dashboard-sidebar-brand
                href="/"
                className="flex h-12 w-full items-center gap-3 rounded-[var(--radius-control)] px-3 text-heading transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0"
              >
                <LogoMark className="h-6 w-6 m3-medium:h-7 m3-medium:w-7" />
                <span className="dashboard-logo-wordmark font-heading type-card-title font-medium tracking-tight group-data-[collapsible=icon]:hidden">
                  Priemman
                </span>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        {/* Sidebar Navigation */}
        <SidebarContent className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full touch-pan-y overscroll-contain">
            <div className="px-3 pb-3 pt-2">
              <NavMain
                items={navData}
                activeParent={activeParent}
                setActiveParent={setActiveParent}
                activeChild={activeChild}
                setActiveChild={setActiveChild}
              />
            </div>
          </ScrollArea>
        </SidebarContent>
        {/* Mobile User Menu */}
        <SidebarFooter className="mt-auto shrink-0 p-[var(--card-padding)] pt-[var(--grid-gap)] m3-large:hidden">
          <NavUser
            user={user}
            onAccountClick={() => setActiveParent("Account")}
          />
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
