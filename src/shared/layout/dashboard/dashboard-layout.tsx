import type { ComponentType, CSSProperties, ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";
import type { CurrentUser } from "@/shared/lib/types/user";

import { DashboardHeader } from "./dashboard-header";

type DashboardSidebarProps = {
  activeParent: string;
  activeChild: string | null;
  setActiveParent: (value: string) => void;
  setActiveChild: (value: string | null) => void;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
};

type DashboardLayoutProps = {
  activeParent: string;
  activeChild: string | null;
  setActiveParent: (value: string) => void;
  setActiveChild: (value: string | null) => void;
  sidebar: ComponentType<DashboardSidebarProps>;
  user: CurrentUser;
  children: ReactNode;
};

// Membuat nama yang ditampilkan dari profile user
export function dashboardDisplayName(user: CurrentUser) {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
  );
}

export function DashboardLayout({
  activeParent,
  activeChild,
  setActiveParent,
  setActiveChild,
  sidebar: LeftSidebar,
  user,
  children,
}: DashboardLayoutProps) {
  // Data ringkas user yang dipakai oleh sidebar navigasi dan menu akun header.
  const sidebarUser = {
    name: dashboardDisplayName(user),
    email: user.email,
    avatar: user.avatarUrl,
  };

  return (
    <SidebarProvider
      className="dashboard-manrope min-h-svh w-full bg-canvas"
      style={
        {
          // Lebar sidebar berasal dari token dashboard agar angka tidak
          // tersebar sebagai hard-coded value di tiap layout atau halaman.
          "--sidebar-width": "var(--dashboard-navigation-width)",
          // Mode collapse mengikuti tinggi header h-18 (72px), sehingga
          // silhouette shell tetap seimbang pada kedua keadaan sidebar.
          "--sidebar-width-icon": "4.5rem",
        } as CSSProperties
      }
    >
      {/* 1. Shell memakai anatomy raw Shadcn sidebar-07: sidebar tetap + inset kerja. */}
      <LeftSidebar
        activeParent={activeParent}
        activeChild={activeChild}
        setActiveParent={setActiveParent}
        setActiveChild={setActiveChild}
        user={sidebarUser}
      />

      <SidebarInset className="m-[var(--dashboard-frame)] min-h-[calc(100svh-(var(--dashboard-frame)*2))] min-w-0 gap-[var(--dashboard-frame)] bg-canvas md:ml-[calc(var(--dashboard-frame)*2)]">
        <DashboardHeader
          activeChild={activeChild}
          activeParent={activeParent}
          onAccountClick={() => {
            setActiveParent("Account");
            setActiveChild(null);
          }}
          user={sidebarUser}
        />
        {/* 2. Content sejajar langsung dengan sisi header: jarak ke sidebar
            hanya berasal dari frame dashboard, bukan frame ditambah padding. */}
        <main className="min-w-0 flex-1 overflow-x-clip pb-[var(--dashboard-content-padding)] pt-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
