"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/shared/ui/sheet";
import { LogoMark } from "@/shared/ui/logo-mark";
import { ModeToggle } from "@/shared/ui/mode-toggle";
import { LanguageToggle } from "@/shared/ui/language-toggle";
import { useT } from "@/shared/providers/language-provider";
import { cn } from "@/shared/lib/utils";
import { CornerCurve } from "@/shared/ui/site-frame";
import { authService, userService } from "@/shared/api";
import { MenuIcon, XIcon } from "@/shared/ui/icons";
import { PrimaryActionLink } from "@/features/landing/components/shared/primary-action-link";
import { Skeleton } from "@/shared/ui/skeleton";

// Menjaga ruang CTA navbar selama GET /users/me memverifikasi cookie session.
function NavbarActionSkeleton() {
  return (
    <Skeleton
      aria-hidden="true"
      className="h-10 w-28 rounded-[var(--radius-signature-action)] bg-surface-muted dark:bg-on-dark/15"
    />
  );
}

export function Navbar() {
  const t = useT();

  // Menyimpan status menu mobile
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Menyimpan hasil pemeriksaan session user
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);

  // Memuat session dan profile singkat untuk navbar
  useEffect(() => {
    let active = true;

    // Memastikan hasil request tidak mengubah state setelah component ditutup
    const loadSession = async () => {
      const hasSession = await authService.hasActiveSession();
      if (!active) return;
      setIsLoggedIn(hasSession);
      if (!hasSession) {
        setSessionChecked(true);
        return;
      }

      try {
        const user = await userService.getMe();
        if (active)
          setFirstName(
            user.firstName.trim().split(/\s+/)[0] || user.email.split("@")[0],
          );
      } catch {
        if (active) setFirstName("");
      } finally {
        if (active) setSessionChecked(true);
      }
    };

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  // Daftar link navigasi utama
  const navLinks = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.explore, href: "/explore" },
    { label: t.nav.contacts, href: "/contact" },
  ];

  const ctaLabel = isLoggedIn ? t.nav.dashboard : t.nav.signIn;
  const ctaHref = isLoggedIn ? "/dashboard" : "/login";

  return (
    <header
      data-site-navbar
      className="fixed inset-x-0 top-0 z-[9998] w-full max-w-none translate-x-0 overflow-hidden rounded-b-[var(--radius-feature)] bg-surface-raised shadow-[var(--shadow-panel)] m3-laptop:top-3.5 m3-laptop:right-auto m3-laptop:left-1/2 m3-laptop:w-[calc(100%_-_8rem)] m3-laptop:max-w-5xl m3-laptop:-translate-x-1/2 m3-laptop:overflow-visible dark:bg-action-ink"
    >
      {/* Navbar Corners */}
      <CornerCurve
        className="pointer-events-none absolute top-0 -left-[48px] hidden text-surface-raised m3-laptop:block dark:text-action-ink"
        style={{ rotate: "180deg" }}
      />
      <CornerCurve
        className="pointer-events-none absolute top-0 -right-[48px] hidden text-surface-raised m3-laptop:block dark:text-action-ink"
        style={{ rotate: "90deg" }}
      />
      <div className="flex h-18 items-center justify-between px-4 m3-medium:px-6 m3-laptop:h-20 m3-laptop:pl-6 m3-laptop:pr-3">
        {/* Brand */}
        <Link
          href="/"
          className="flex min-h-12 min-w-12 shrink-0 items-center gap-2.5 rounded-[var(--radius-control)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
        >
          <LogoMark className="h-6 w-6 m3-medium:h-7 m3-medium:w-7 dark:brightness-0 dark:invert" />
          <span className="hidden font-heading type-card-title tracking-tight text-heading m3-laptop:inline dark:text-on-dark">
            {t.hero.brand}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 m3-laptop:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "group relative inline-flex min-h-12 items-center rounded-full px-4 py-2 type-label font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand",
                  isActive
                    ? "text-heading dark:text-on-dark"
                    : "text-copy-secondary hover:bg-surface-muted hover:text-heading dark:text-on-dark/70 dark:hover:bg-on-dark/10 dark:hover:text-on-dark",
                )}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-4 -bottom-px h-px origin-left bg-heading transition-transform dark:bg-on-dark duration-300",
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                  )}
                />
              </a>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-0 m3-laptop:flex">
          <ModeToggle />
          <div className="flex items-center gap-1">
            <LanguageToggle />
            {sessionChecked ? (
              <PrimaryActionLink href={ctaHref} size="compact">
                {ctaLabel}
              </PrimaryActionLink>
            ) : (
              <NavbarActionSkeleton />
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className={buttonVariants({
              variant: "ghost",
              size: "icon",
              className:
                "text-heading hover:bg-surface-muted hover:text-heading m3-laptop:hidden dark:text-on-dark dark:hover:bg-on-dark/10 dark:hover:text-on-dark",
            })}
            aria-label={t.nav.openMenu}
          >
            <MenuIcon size={20} />
          </SheetTrigger>
          <SheetContent
            side="top"
            showCloseButton={false}
            className="inset-x-0 top-0 h-[92dvh] gap-0 rounded-b-[var(--radius-feature)] border-0 bg-surface p-4 max-[425px]:h-auto m3-medium:p-8"
          >
            <div className="flex items-center justify-between">
              <SheetTitle className="type-card-title flex min-w-0 items-center gap-2.5 text-copy max-[425px]:gap-2">
                <LogoMark className="size-7 max-[425px]:size-6" />
                <span className="truncate">{t.hero.brand}</span>
              </SheetTitle>
              <div className="flex shrink-0 items-center gap-0">
                <ModeToggle />
                <div className="flex items-center gap-[2px]">
                  <LanguageToggle />
                  <SheetClose
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon",
                      className: "text-copy hover:bg-surface-muted hover:text-heading",
                    })}
                    aria-label={t.nav.closeMenu}
                  >
                    <XIcon className="max-[425px]:scale-90" size={24} />
                  </SheetClose>
                </div>
              </div>
            </div>

            <nav className="mt-4 flex flex-col max-[425px]:mt-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="type-card-title flex min-h-12 items-center justify-between border-b border-border-subtle py-5 text-copy focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-brand max-[425px]:py-3.5"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="mt-auto flex items-center justify-between gap-4 pt-6 max-[425px]:mt-0 max-[425px]:gap-2 max-[425px]:pt-4">
              <span className="type-body text-copy-secondary">
                {isLoggedIn
                  ? t.nav.welcomeGuest.replace(
                      /guest|tamu/i,
                      firstName || "user",
                    )
                  : t.nav.welcomeGuest}
              </span>
              {sessionChecked ? (
                <PrimaryActionLink
                  href={ctaHref}
                  size="compact"
                  onClick={() => setOpen(false)}
                >
                  {ctaLabel}
                </PrimaryActionLink>
              ) : (
                <NavbarActionSkeleton />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
