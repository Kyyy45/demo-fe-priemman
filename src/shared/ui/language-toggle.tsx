"use client";

import { Check } from "lucide-react";
import type { ReactElement } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { useLanguage, useT } from "@/shared/providers/language-provider";
import type { Language } from "@/shared/lib/translations";
import { cn } from "@/shared/lib/utils";

function FlagEn({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
      <rect width="60" height="60" fill="#012169" />
      <path d="M0 0l60 60M60 0L0 60" stroke="#ffffff" strokeWidth="12" />
      <path d="M0 0l60 60M60 0L0 60" stroke="#C8102E" strokeWidth="6" />
      <path d="M30 0v60M0 30h60" stroke="#ffffff" strokeWidth="16" />
      <path d="M30 0v60M0 30h60" stroke="#C8102E" strokeWidth="9" />
    </svg>
  );
}

function FlagId({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
      <rect width="60" height="30" fill="#CE1126" />
      <rect y="30" width="60" height="30" fill="#F5F5F5" />
    </svg>
  );
}

// Memetakan language ke icon bendera
const FLAGS: Record<Language, (props: { className?: string }) => ReactElement> = {
  en: FlagEn,
  id: FlagId,
};

// Label yang dibaca screen reader untuk setiap language
const LABELS: Record<Language, string> = {
  en: "English",
  id: "Indonesia",
};

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const t = useT();

  // Memilih bendera sesuai language yang sedang aktif
  const CurrentFlag = FLAGS[lang];

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={t.nav.switchLanguage}
        title={t.nav.switchLanguage}
        className={cn(
          "group inline-flex size-12 items-center justify-center rounded-full bg-transparent p-1 transition-transform duration-200 active:translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand",
          className,
        )}
      >
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-transparent transition-colors duration-200 group-hover:bg-surface-muted group-focus-visible:bg-surface-muted">
          <span className="size-5 overflow-hidden rounded-full ring-1 ring-inset ring-heading/10">
            <CurrentFlag className="size-full" />
          </span>
        </span>
      </DropdownMenuTrigger>

      {/* Language Options */}
      {/* z-index sudah ditangani default DropdownMenuContent (lihat dropdown-menu.tsx) */}
      <DropdownMenuContent align="end" className="min-w-40">
        {(Object.keys(LABELS) as Language[]).map((code) => {
          const Flag = FLAGS[code];
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => setLang(code)}
              className="min-h-10 gap-2.5 px-2.5"
            >
              <span className="size-4 overflow-hidden rounded-full ring-1 ring-heading/10">
                <Flag className="size-full" />
              </span>
              {LABELS[code]}
              {lang === code && <Check className="ml-auto size-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
