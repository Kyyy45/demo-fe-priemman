"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LoaderCircle, Search, UserPlus } from "lucide-react";

import {
  creatorDirectory,
  creatorDisplayName,
  extractUserId,
  type CreatorSummary,
} from "@/shared/api";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

type Option =
  | { kind: "creator"; creator: CreatorSummary }
  | { kind: "id"; id: string };

export type CollaboratorPick = { id: string; creator?: CreatorSummary };

export function CreatorAvatar({
  className,
  creator,
}: {
  className?: string;
  creator?: CreatorSummary;
}) {
  const name = creator ? creatorDisplayName(creator) : "";
  return (
    <Avatar className={cn("size-10", className)}>
      {creator?.avatarUrl ? (
        <AvatarImage alt={name} src={creator.avatarUrl} />
      ) : null}
      <AvatarFallback className="bg-surface-muted type-label font-semibold text-copy-secondary">
        {name.charAt(0).toUpperCase() || "P"}
      </AvatarFallback>
    </Avatar>
  );
}

// Combobox ala Behance "Co-Owners": ketik nama → pilih creator. Menempel
// User ID / link profil (`/creator?id=...`) juga diterima sebagai jalan
// pintas untuk orang yang belum muncul di hasil pencarian.
export function CollaboratorPicker({
  copy,
  excludeIds,
  inputId,
  onSelect,
}: {
  copy: {
    search: string;
    placeholder: string;
    help: string;
    searching: string;
    noResults: string;
    addId: string;
  };
  excludeIds: string[];
  inputId: string;
  onSelect: (pick: CollaboratorPick) => void;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [result, setResult] = useState<{
    query: string;
    items: CreatorSummary[];
  }>({ query: "", items: [] });

  const term = query.trim();
  const pastedId = extractUserId(term);
  const searching = !pastedId && term.length >= 2;

  // Debounce 250ms; hasil lama diabaikan bila query sudah berubah.
  useEffect(() => {
    if (!searching) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      creatorDirectory.search(term).then(
        (items) => {
          if (!cancelled) setResult({ query: term, items });
        },
        () => {
          if (!cancelled) setResult({ query: term, items: [] });
        },
      );
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searching, term]);

  const loading = searching && result.query !== term;
  const options: Option[] = pastedId
    ? [{ kind: "id", id: pastedId }]
    : searching && !loading
      ? result.items
          .filter((creator) => !excludeIds.includes(creator.id))
          .map((creator) => ({ kind: "creator", creator }))
      : [];
  const activeIndex = Math.min(active, Math.max(options.length - 1, 0));
  const showList = open && (searching || Boolean(pastedId));

  // Kolom ini ada di bagian bawah dialog yang bisa di-scroll; tanpa ini
  // daftar hasil bisa muncul di luar area terlihat.
  const listRef = useRef<HTMLUListElement>(null);
  const resultCount = options.length;
  useEffect(() => {
    if (showList)
      listRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [showList, loading, resultCount]);

  const choose = (option: Option) => {
    onSelect(
      option.kind === "creator"
        ? { id: option.creator.id, creator: option.creator }
        : { id: option.id },
    );
    setQuery("");
    setActive(0);
  };

  return (
    <div>
      {/* Daftar hasil di-anchor ke input (bukan ke wrapper yang juga berisi
          teks bantuan), jadi muncul tepat di bawah kolom pencarian. */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-copy-muted" />
        <input
          aria-activedescendant={
            showList && options.length
              ? `${listId}-${activeIndex}`
              : undefined
          }
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showList}
          aria-label={copy.search}
          autoComplete="off"
          className="flex min-h-12 w-full rounded-[var(--radius-control)] border border-input bg-transparent py-2 pl-11 pr-11 type-body outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          id={inputId}
          onBlur={() => setOpen(false)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && options.length) {
              event.preventDefault();
              setOpen(true);
              setActive((activeIndex + 1) % options.length);
            } else if (event.key === "ArrowUp" && options.length) {
              event.preventDefault();
              setActive((activeIndex - 1 + options.length) % options.length);
            } else if (event.key === "Enter") {
              // Enter jangan sampai men-submit / menutup dialog.
              event.preventDefault();
              if (showList && options[activeIndex])
                choose(options[activeIndex]);
            } else if (event.key === "Escape" && showList) {
              // Tutup daftar saja, bukan dialog Detail proyek.
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
            }
          }}
          placeholder={copy.placeholder}
          role="combobox"
          value={query}
        />
        {loading ? (
          <LoaderCircle className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-copy-muted" />
        ) : null}
        {showList ? (
          <ul
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-[var(--radius-control)] border border-border-subtle bg-popover py-1 text-popover-foreground shadow-lg"
            id={listId}
            ref={listRef}
            role="listbox"
          >
            {loading ? (
              <li className="px-4 py-3 type-label text-copy-secondary">
                {copy.searching}
              </li>
            ) : options.length === 0 ? (
              <li className="px-4 py-3 type-label text-copy-secondary">
                {copy.noResults}
              </li>
            ) : (
              options.map((option, index) => {
                const selected = index === activeIndex;
                return (
                  <li
                    aria-selected={selected}
                    className={cn(
                      "flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2",
                      selected ? "bg-brand text-on-brand" : "text-copy",
                    )}
                    id={`${listId}-${index}`}
                    key={option.kind === "creator" ? option.creator.id : option.id}
                    // mousedown (bukan click) + preventDefault supaya input
                    // tidak blur dan menutup daftar sebelum pilihan tercatat.
                    onMouseDown={(event) => {
                      event.preventDefault();
                      choose(option);
                    }}
                    onMouseEnter={() => setActive(index)}
                    role="option"
                  >
                    {option.kind === "creator" ? (
                      <>
                        <CreatorAvatar creator={option.creator} />
                        <span className="min-w-0">
                          <span className="block truncate type-label font-semibold">
                            {creatorDisplayName(option.creator)}
                          </span>
                          {option.creator.headline ? (
                            <span
                              className={cn(
                                "block truncate type-metadata",
                                selected ? "text-on-brand/80" : "text-copy-secondary",
                              )}
                            >
                              {option.creator.headline}
                            </span>
                          ) : null}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-copy-secondary">
                          <UserPlus className="size-4" />
                        </span>
                        <span className="min-w-0 truncate type-label font-medium">
                          {copy.addId.replace("{id}", option.id)}
                        </span>
                      </>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>
      <p className="mt-2 type-metadata leading-relaxed text-copy-secondary">
        {copy.help}
      </p>
    </div>
  );
}
