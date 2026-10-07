"use client";

import * as React from "react";

export type DashboardLocation = {
  parent: string;
  child: string | null;
};

type DashboardNavigationOptions = {
  defaultParent: string;
  sectionByParent: Record<string, string>;
  resolveInitialLocation?: () => DashboardLocation | null;
};

// Membaca section dan page aktif dari URL
function readLocation(
  defaultParent: string,
  sectionByParent: Record<string, string>,
): DashboardLocation {
  if (typeof window === "undefined") {
    return { parent: defaultParent, child: null };
  }

  // Mengambil nilai navigasi dari query parameter
  const params = new URLSearchParams(window.location.search);
  const requestedSection = params.get("section");
  const parentBySection = Object.fromEntries(
    Object.entries(sectionByParent).map(([parent, section]) => [
      section,
      parent,
    ]),
  );

  return {
    parent: parentBySection[requestedSection ?? ""] ?? defaultParent,
    child: params.get("page"),
  };
}

export function useDashboardNavigation({
  defaultParent,
  sectionByParent,
  resolveInitialLocation,
}: DashboardNavigationOptions) {
  const restoringHistoryRef = React.useRef(false);
  const hasSynchronizedUrlRef = React.useRef(false);
  // Menyimpan menu dashboard yang sedang aktif
  const [location, setLocation] = React.useState<DashboardLocation>(() => {
    if (typeof window !== "undefined") {
      const restoredLocation = resolveInitialLocation?.();
      if (restoredLocation) return restoredLocation;
    }

    return readLocation(defaultParent, sectionByParent);
  });

  // Memperbarui menu aktif saat user memakai tombol back atau forward browser
  React.useEffect(() => {
    const handlePopState = () => {
      restoringHistoryRef.current = true;
      setLocation(readLocation(defaultParent, sectionByParent));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [defaultParent, sectionByParent]);

  // Menyimpan perpindahan menu ke history browser. Popstate hanya memulihkan
  // state, sehingga Back/Forward tidak membuat entry baru.
  React.useEffect(() => {
    const url = new URL(window.location.href);
    url.hash = "";
    url.searchParams.set(
      "section",
      sectionByParent[location.parent] ?? sectionByParent[defaultParent],
    );

    if (location.child) url.searchParams.set("page", location.child);
    else url.searchParams.delete("page");

    const nextPath = `${url.pathname}${url.search}`;
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const state = {
      section: url.searchParams.get("section"),
      page: location.child,
    };

    if (restoringHistoryRef.current) {
      restoringHistoryRef.current = false;
      hasSynchronizedUrlRef.current = true;
      return;
    }

    if (!hasSynchronizedUrlRef.current || nextPath === currentPath) {
      window.history.replaceState(state, "", nextPath);
      hasSynchronizedUrlRef.current = true;
      return;
    }

    window.history.pushState(state, "", nextPath);
  }, [defaultParent, location, sectionByParent]);

  // Membuka menu utama dan menutup submenu yang sebelumnya aktif
  const setActiveParent = React.useCallback((parent: string) => {
    setLocation({ parent, child: null });
  }, []);

  // Mengubah submenu aktif tanpa mengganti menu utamanya
  const setActiveChild = React.useCallback((child: string | null) => {
    setLocation((current) => ({ ...current, child }));
  }, []);

  return {
    activeParent: location.parent,
    activeChild: location.child,
    setActiveParent,
    setActiveChild,
  };
}
