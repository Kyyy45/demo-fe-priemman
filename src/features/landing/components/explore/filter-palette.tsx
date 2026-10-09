"use client";

import { useEffect, useRef, useState } from "react";
import type { Icon } from "@phosphor-icons/react";
import {
  ArrowCounterClockwise,
  Check,
  Clock,
  Flame,
  MagnifyingGlass,
  Sparkle,
  Tag,
  X,
} from "@phosphor-icons/react";
import { useT } from "@/shared/providers/language-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { SortId } from "@/shared/lib/types/explore";
import { cn } from "@/shared/lib/utils";

type GroupId = "tag" | "sort" | "action";

// Urutan group yang tampil pada command palette
const GROUP_ORDER: GroupId[] = ["tag", "sort", "action"];

type Command = {
  id: string;
  group: GroupId;
  label: string;
  icon: Icon;
  active: boolean;
  run: () => void;
};

type FilterPaletteProps = {
  tags: string[];
  tag: string | null;
  sort: SortId;
  onTag: (value: string | null) => void;
  onSort: (value: SortId) => void;
  onClear: () => void;
  /** Kelas tambahan untuk wadah tombol + chip (mis. rata kanan di hero). */
  className?: string;
};

export function FilterPalette({
  tags,
  tag,
  sort,
  onTag,
  onSort,
  onClear,
  className,
}: FilterPaletteProps) {
  const t = useT();
  const p = t.explore.palette;

  // Menyimpan status palette, pencarian, dan item aktif
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Membuka palette melalui shortcut keyboard
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        setQuery("");
        setActiveIndex(0);
        return;
      }
      const target = event.target as HTMLElement;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable;
      if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        setOpen(true);
        setQuery("");
        setActiveIndex(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Mengarahkan scroll ke command yang sedang aktif
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, query, open]);

  // Mengubah semua filter menjadi daftar command
  const commands: Command[] = [
    ...tags.map((id) => ({
      id: `tag-${id}`,
      group: "tag" as const,
      label: id,
      icon: Tag,
      active: tag === id,
      run: () => onTag(tag === id ? null : id),
    })),
    {
      id: "sort-forYou",
      group: "sort",
      label: t.explore.sortForYou,
      icon: Sparkle,
      active: sort === "forYou",
      run: () => onSort("forYou"),
    },
    {
      id: "sort-popular",
      group: "sort",
      label: t.explore.sortPopular,
      icon: Flame,
      active: sort === "popular",
      run: () => onSort("popular"),
    },
    {
      id: "sort-latest",
      group: "sort",
      label: t.explore.sortLatest,
      icon: Clock,
      active: sort === "latest",
      run: () => onSort("latest"),
    },
    ...(tag !== null || sort !== "forYou"
      ? [
          {
            id: "action-clear",
            group: "action" as const,
            label: p.clearAll,
            icon: ArrowCounterClockwise,
            active: false,
            run: onClear,
          },
        ]
      : []),
  ];

  // Menyaring command berdasarkan teks pencarian
  const filtered = query.trim()
    ? commands.filter((command) =>
        command.label.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : commands;

  const groupLabel: Record<GroupId, string> = {
    tag: p.groupTag,
    sort: p.groupSort,
    action: p.groupAction,
  };

  // Menjalankan command lalu menutup palette
  const runCommand = (command: Command) => {
    command.run();
    setOpen(false);
  };

  // Mengatur navigasi command dengan keyboard
  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % Math.max(filtered.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (index) => (index - 1 + filtered.length) % Math.max(filtered.length, 1),
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const command = filtered[activeIndex];
      if (command) runCommand(command);
    }
  };

  let flatIndex = -1;

  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setQuery("");
          setActiveIndex(0);
        }}
        className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-full border border-border-subtle bg-surface-raised px-4 py-2 type-label text-copy-secondary shadow-[var(--shadow-control)] transition-colors hover:border-border-strong hover:text-heading focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
      >
        <MagnifyingGlass className="size-4" />
        <span>{p.open}</span>
        <Kbd>F</Kbd>
      </button>

      {tag !== null && (
        <FilterChip
          label={tag}
          removeAria={p.removeAria}
          onRemove={() => onTag(null)}
        />
      )}
      {sort !== "forYou" && (
        <FilterChip
          label={
            sort === "popular" ? t.explore.sortPopular : t.explore.sortLatest
          }
          removeAria={p.removeAria}
          onRemove={() => onSort("forYou")}
        />
      )}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) setQuery("");
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="top-[calc(env(safe-area-inset-top)_+_1rem)] max-h-[calc(100dvh_-_2rem_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom))] max-w-[calc(100%_-_2rem)] -translate-y-0 gap-0 overflow-hidden rounded-[var(--radius-dialog)] p-0 m3-medium:max-w-lg"
        >
          <DialogTitle className="sr-only">{p.open}</DialogTitle>
          <DialogDescription className="sr-only">
            {p.placeholder}
          </DialogDescription>

          <div className="flex items-center gap-2.5 border-b border-border-subtle bg-surface-muted px-4">
            <MagnifyingGlass className="size-4 shrink-0 text-copy-secondary" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder={p.placeholder}
              className="h-12 w-full bg-transparent type-label text-copy outline-none placeholder:text-copy-muted"
            />
            <Kbd>esc</Kbd>
          </div>

          <div
            ref={listRef}
            className="max-h-[min(28rem,calc(100dvh_-_10rem))] overflow-y-auto overscroll-contain p-2"
          >
            {filtered.length === 0 ? (
              <p className="px-3 py-8 text-center type-label text-copy-secondary">
                {p.noResults}
              </p>
            ) : (
              GROUP_ORDER.map((group) => {
                const items = filtered.filter(
                  (command) => command.group === group,
                );
                if (items.length === 0) return null;
                return (
                  <div key={group}>
                    <p className="px-2.5 pt-3 pb-1.5 type-metadata font-medium tracking-wider text-copy-muted uppercase">
                      {groupLabel[group]}
                    </p>
                    {items.map((command) => {
                      flatIndex += 1;
                      const index = flatIndex;
                      return (
                        <button
                          key={command.id}
                          type="button"
                          data-active={index === activeIndex}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => runCommand(command)}
                          className={cn(
                            "flex min-h-12 w-full cursor-pointer items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2 text-left type-label text-copy-secondary transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand",
                            index === activeIndex &&
                              "bg-surface-muted text-heading",
                          )}
                        >
                          <command.icon className="size-4 shrink-0" />
                          <span className="truncate">{command.label}</span>
                          {command.active && (
                            <Check
                              className="ml-auto size-4 shrink-0 text-heading"
                              weight="bold"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-4 border-t border-border-subtle bg-surface-muted px-4 py-2.5 type-metadata text-copy-secondary">
            <span className="flex items-center gap-1.5">
              <Kbd>↑↓</Kbd> {p.navigate}
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>↵</Kbd> {p.select}
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>esc</Kbd> {p.close}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="flex h-5 min-w-5 items-center justify-center rounded-[calc(var(--radius-control)/2)] border border-border-subtle bg-surface-muted px-1 type-metadata font-medium text-copy-secondary">
      {children}
    </kbd>
  );
}

function FilterChip({
  label,
  removeAria,
  onRemove,
}: {
  label: string;
  removeAria: string;
  onRemove: () => void;
}) {
  return (
    <span className="flex min-h-12 max-w-full min-w-0 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-raised py-1.5 pr-1.5 pl-3 type-label text-copy shadow-[var(--shadow-control)]">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeAria}
        className="flex size-12 cursor-pointer items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-surface-muted hover:text-heading active:translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
      >
        <X className="size-3" weight="bold" />
      </button>
    </span>
  );
}
