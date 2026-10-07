"use client";

import { useState } from "react";
import { BadgeCheck, ChevronsUpDown, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/ui/sidebar";
import { authService } from "@/shared/api";
import { getAvatarFallbackUrl } from "@/shared/lib/avatar";
import { Button } from "@/shared/ui/button";

// Membuat dua huruf inisial dari nama atau email user
function initialsFor(name: string, email: string) {
  const source = name || email || "Priemman";
  const words = source.split(/[\s@._-]+/).filter(Boolean);

  return (words[0]?.[0] ?? "P").concat(words[1]?.[0] ?? "R").toUpperCase();
}

export function NavUser({
  user,
  onAccountClick,
  placement = "sidebar",
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  onAccountClick?: () => void;
  placement?: "sidebar" | "header";
}) {
  // Mengambil status sidebar untuk menyesuaikan dropdown di mobile
  const { isMobile, setOpenMobile } = useSidebar();

  // Menyimpan status logout agar tombol tidak dijalankan dua kali
  const [loggingOut, setLoggingOut] = useState(false);

  // Menyiapkan data avatar yang akan ditampilkan
  const initials = initialsFor(user.name, user.email);
  const fallbackAvatar = getAvatarFallbackUrl(user.name || user.email);
  const avatarSrc = user.avatar || fallbackAvatar;

  // Membuka halaman account lalu menutup sidebar mobile
  const handleAccountClick = () => {
    onAccountClick?.();
    setOpenMobile(false);
  };

  // Menghapus session lalu kembali ke halaman login
  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    await authService.logout().catch(() => undefined);
    window.location.replace("/login");
  };

  const userMenu = (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          placement === "header" ? (
            <Button
              aria-label="Open account menu"
              className="!size-10 !min-h-10 rounded-full p-1"
              size="sm"
              variant="ghost"
            />
          ) : (
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            />
          )
        }
      >
        {placement === "header" ? (
          <Avatar className="size-8 rounded-full">
            <AvatarImage src={avatarSrc} alt={user.name} />
            <AvatarFallback className="rounded-full">
              {initials}
            </AvatarFallback>
          </Avatar>
        ) : (
          <>
            <Avatar className="size-9 rounded-[var(--radius-control)]">
              <AvatarImage src={avatarSrc} alt={user.name} />
              <AvatarFallback className="rounded-[var(--radius-control)]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left leading-tight">
              <span className="truncate m3-label-large text-heading">
                {user.name}
              </span>
              <span className="truncate type-metadata">{user.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={placement === "header" ? "end" : "start"}
        className="dashboard-manrope w-(--radix-dropdown-menu-trigger-width) min-w-56"
        side={placement === "header" || isMobile ? "bottom" : "left"}
        sideOffset={4}
      >
        {/* User Info — DropdownMenuLabel dibungkus DropdownMenuGroup karena di
            Base UI, DropdownMenuLabel = Menu.GroupLabel, yang WAJIB berada di
            dalam Menu.Group/Menu.RadioGroup. Tanpa Group ini, Base UI throw
            runtime error "MenuGroupContext is missing" begitu dropdown dibuka. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex min-h-12 items-center gap-2 px-1 py-1.5 text-left">
              <Avatar className="size-9 rounded-[var(--radius-control)]">
                <AvatarImage src={avatarSrc} alt={user.name} />
                <AvatarFallback className="rounded-[var(--radius-control)]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate m3-label-large text-heading">
                  {user.name}
                </span>
                <span className="truncate type-metadata">{user.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* Account Action */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="h-10 min-h-10 cursor-pointer"
            onClick={handleAccountClick}
          >
            <BadgeCheck className="mr-2 !text-brand" />
            Account
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* Logout Action */}
        <DropdownMenuItem
          className="h-10 min-h-10 cursor-pointer"
          disabled={loggingOut}
          onClick={handleLogout}
        >
          <LogOut className="mr-2 !text-copy" />
          {loggingOut ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (placement === "header") {
    return userMenu;
  }

  return (
    <SidebarMenu>
      {/* User Menu */}
      <SidebarMenuItem>{userMenu}</SidebarMenuItem>
    </SidebarMenu>
  );
}
