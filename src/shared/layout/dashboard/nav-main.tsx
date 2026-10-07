"use client";

import * as React from "react";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/shared/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/shared/ui/sidebar";

export type NavItem = {
  label?: string;
  isSection?: boolean;
  title?: string;
  icon?: LucideIcon;
  href?: string;
  disabled?: boolean;
  children?: NavItem[];
};

// Satu ukuran untuk menu dashboard: baris lega saat terbuka, icon tunggal
// 48px yang tetap presisi di tengah saat sidebar collapse.
// PENTING soal selector active: Base UI mengubah state boolean `true` jadi
// ATRIBUT STRING KOSONG (data-active=""), bukan data-active="true" — lihat
// node_modules/@base-ui/react/internals/getStateAttributesProps.js
// (`if (value === true) props["data-"+key] = ''`). Jadi selector yang benar
// adalah `data-active:` (variant bawaan Tailwind, cocok dengan KEHADIRAN
// atribut lewat :not([data-active=false])), BUKAN `data-[active=true]:`
// (cuma cocok kalau nilainya string "true" persis — tidak akan pernah match).
// !important tetap dipakai karena base SidebarMenuButton juga sudah punya
// data-active:bg-sidebar-accent tanpa !important pada selector yang SAMA;
// tanpa !important, urutan menang di cascade tidak terjamin konsisten.
const DASHBOARD_MENU_BUTTON_CLASS =
  "h-[var(--dashboard-menu-height)] min-h-[var(--dashboard-menu-height)] w-full gap-3 rounded-[var(--radius-control)] px-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:bg-brand! data-active:font-medium! data-active:text-on-brand! [&>svg]:size-5 group-data-[collapsible=icon]:!size-[var(--dashboard-menu-height)] group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:[&>svg:not(:first-child)]:hidden";

export function NavMain({
  items,
  activeParent,
  setActiveParent,
  activeChild,
  setActiveChild,
}: {
  items: NavItem[];
  activeParent: string;
  setActiveParent: (val: string) => void;
  activeChild: string | null;
  setActiveChild: (val: string | null) => void;
}) {
  return (
    <div className="space-y-[var(--dashboard-menu-gap)]">
      {items.map((item, index) => (
        <NavMainItem
          key={item.title || item.label || index}
          item={item}
          activeParent={activeParent}
          setActiveParent={setActiveParent}
          activeChild={activeChild}
          setActiveChild={setActiveChild}
        />
      ))}
    </div>
  );
}

function NavMainItem({
  item,
  activeParent,
  setActiveParent,
  activeChild,
  setActiveChild,
}: {
  item: NavItem;
  activeParent: string | null;
  activeChild: string | null;
  setActiveParent: (val: string) => void;
  setActiveChild: (val: string | null) => void;
}) {
  // Menyiapkan state yang menentukan bentuk dan status menu
  const hasChildren = !!item.children?.length;
  const isParentActive = activeParent === item.title;
  // isOpen murni dikendalikan userOpen (bukan `isParentActive || userOpen`) —
  // kalau di-OR dengan isParentActive, begitu menu ini aktif maka isOpen
  // selalu true selamanya walau userOpen di-toggle false, jadi klik tombol
  // utama lagi tidak pernah bisa menutupnya. Sebagai gantinya, auto-expand
  // sekali saat menu ini BARU menjadi aktif, lalu biarkan user bebas toggle
  // buka/tutup sesudahnya. "Prev" disimpan sebagai state (bukan ref — project
  // ini melarang akses ref saat render), mengikuti pola resmi React
  // "adjusting state when a prop changes": setState di luar effect, dibatasi
  // kondisi supaya tidak infinite loop.
  const [userOpen, setUserOpen] = React.useState(isParentActive);
  const [prevParentActive, setPrevParentActive] = React.useState(isParentActive);
  if (isParentActive !== prevParentActive) {
    setPrevParentActive(isParentActive);
    if (isParentActive) setUserOpen(true);
  }
  const isOpen = userOpen;
  const { setOpenMobile } = useSidebar();

  // Membuka menu utama lalu menutup sidebar mobile
  const selectParent = () => {
    if (!item.title) return;
    setActiveParent(item.title);
    setActiveChild(null);
    setOpenMobile(false);
  };

  // Menampilkan label pemisah antar-group menu
  if (item.isSection && item.label) {
    return (
      <SidebarGroup className="p-0 pt-[var(--card-padding)] first:pt-0">
        <SidebarGroupLabel className="p-0 m3-label-medium tracking-wide">
          {item.label}
        </SidebarGroupLabel>
      </SidebarGroup>
    );
  }

  // Menampilkan menu utama yang memiliki submenu
  if (hasChildren && item.title) {
    if (item.disabled) {
      return (
        <SidebarGroup className="p-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                aria-disabled="true"
                id={`nav-main-trigger-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                tooltip={`${item.title} (coming soon)`}
                className={cn(
                  DASHBOARD_MENU_BUTTON_CLASS,
                  "w-full cursor-not-allowed text-copy-disabled",
                )}
                onClick={(event) => event.preventDefault()}
              >
                {item.icon && <item.icon size={16} />}
                <span>{item.title}</span>
                <ChevronRight className="ml-auto" />
                <span className="sr-only">Unavailable</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      );
    }

    return (
      <SidebarGroup className="p-0">
        <SidebarMenu>
          <Collapsible open={isOpen} onOpenChange={setUserOpen}>
            <SidebarMenuItem>
              {/* Standar dropdown: klik baris utama hanya buka/tutup submenu,
                  tidak ikut berpindah halaman. Navigasi hanya terjadi lewat
                  klik submenu (lihat NavMainSubItem) — tidak ada onClick di
                  sini, cukup serahkan ke toggle bawaan Collapsible. */}
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton
                    id={`nav-main-trigger-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    tooltip={item.title}
                    isActive={isParentActive}
                    className={cn(
                      DASHBOARD_MENU_BUTTON_CLASS,
                      "w-full cursor-pointer",
                    )}
                  />
                }
              >
                {item.icon && <item.icon size={16} />}
                <span>{item.title}</span>
                <ChevronRight
                  className={cn(
                    "ml-auto transition-transform duration-200",
                    isOpen && "rotate-90",
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="me-0 pe-0">
                  {item.children!.map((child, index) => (
                    <NavMainSubItem
                      key={child.title || index}
                      item={child}
                      activeParent={activeParent}
                      setActiveParent={setActiveParent}
                      activeChild={activeChild}
                      setActiveChild={setActiveChild}
                      parentTitle={item.title}
                    />
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  // Menampilkan menu utama tanpa submenu
  if (item.title) {
    if (item.disabled) {
      return (
        <SidebarGroup className="p-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                aria-disabled="true"
                id={`nav-main-button-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                tooltip={`${item.title} (coming soon)`}
                className={cn(
                  DASHBOARD_MENU_BUTTON_CLASS,
                  "cursor-not-allowed text-copy-disabled",
                )}
                onClick={(event) => event.preventDefault()}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                <span className="sr-only">Unavailable</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      );
    }

    return (
      <SidebarGroup className="p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                item.href && item.href !== "#" ? (
                  <a href={item.href} />
                ) : (
                  <button type="button" />
                )
              }
              id={`nav-main-button-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
              tooltip={item.title}
              isActive={isParentActive}
              onClick={selectParent}
              className={cn(DASHBOARD_MENU_BUTTON_CLASS, "cursor-pointer")}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return null;
}

function NavMainSubItem({
  item,
  activeParent,
  setActiveParent,
  activeChild,
  setActiveChild,
  parentTitle,
}: {
  item: NavItem;
  activeParent: string | null;
  activeChild: string | null;
  setActiveParent: (val: string) => void;
  setActiveChild: (val: string | null) => void;
  parentTitle?: string;
}) {
  // Menyimpan status submenu bertingkat
  const hasChildren = !!item.children?.length;
  const [isOpen, setIsOpen] = React.useState(false);
  const { setOpenMobile } = useSidebar();

  if (hasChildren && item.title) {
    if (item.disabled) {
      return (
        <SidebarMenuSubItem>
          <SidebarMenuSubButton
            aria-disabled="true"
            className="w-full cursor-not-allowed text-copy-disabled"
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            <ChevronRight className="ml-auto" />
            <span className="sr-only">Unavailable</span>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      );
    }

    return (
      <SidebarMenuSubItem>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger
            render={
              <SidebarMenuSubButton
                id={`nav-sub-trigger-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="!h-[var(--dashboard-submenu-height)] !min-h-[var(--dashboard-submenu-height)] !w-full"
              />
            }
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            <ChevronRight
              className={cn(
                "ml-auto transition-transform duration-200",
                isOpen && "rotate-90",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="me-0 pe-0">
              {item.children!.map((child, index) => (
                <NavMainSubItem
                  key={child.title || index}
                  item={child}
                  activeParent={activeParent}
                  setActiveParent={setActiveParent}
                  activeChild={activeChild}
                  setActiveChild={setActiveChild}
                  parentTitle={parentTitle}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuSubItem>
    );
  }

  if (item.title) {
    if (item.disabled) {
      return (
        <SidebarMenuSubItem className="w-full">
          <SidebarMenuSubButton
            aria-disabled="true"
            className="w-full cursor-not-allowed text-copy-disabled"
          >
            {item.title}
            <span className="sr-only">Unavailable</span>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      );
    }

    return (
      <SidebarMenuSubItem className="w-full">
        <SidebarMenuSubButton
          render={
            item.href && item.href !== "#" ? (
              <a href={item.href} />
            ) : (
              <button type="button" />
            )
          }
          id={`nav-sub-button-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
          // Override warna active bawaan SidebarMenuSubButton (data-active:bg-sidebar-accent,
          // abu-abu generik) supaya konsisten dengan warna active menu utama (bg-brand/primary).
          // Base UI mengubah state boolean `active=true` jadi atribut KOSONG
          // (data-active=""), bukan data-active="true" — lihat
          // node_modules/@base-ui/react/internals/getStateAttributesProps.js.
          // Jadi selector harus `data-active:`, BUKAN `data-[active=true]:`
          // (selector itu cuma cocok dengan nilai string "true" persis,
          // yang tidak pernah benar-benar di-set oleh Base UI). !important
          // tetap dipakai karena base class ada di selector yang sama
          // persis (data-active:bg-sidebar-accent) tanpa !important.
          className="!h-[var(--dashboard-submenu-height)] !min-h-[var(--dashboard-submenu-height)] !w-full data-active:bg-brand! data-active:font-medium! data-active:text-on-brand!"
          isActive={activeChild === item.title}
          onClick={() => {
            setActiveParent(parentTitle || "");
            setActiveChild(item.title!);
            setOpenMobile(false);
          }}
        >
          {item.title}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  return null;
}
