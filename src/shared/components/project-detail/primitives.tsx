import type { ReactNode } from "react";
import { motion } from "motion/react";
import { X } from "@phosphor-icons/react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { cn } from "@/shared/lib/utils";

// Potongan kecil yang dipakai berulang oleh discussion panel dan modal-modal
// project detail (lihat ./modals.tsx) — digabung di sini supaya tidak ada
// banyak file satu-dua-komponen yang sulit dipindai.

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  className?: string;
}

export function ProjectAvatar({ name, avatarUrl, className }: AvatarProps) {
  return (
    <Avatar className={cn("size-9 bg-surface-muted", className)}>
      <AvatarImage alt={name} src={avatarUrl} />
      <AvatarFallback>{name.trim().charAt(0).toUpperCase() || "P"}</AvatarFallback>
    </Avatar>
  );
}

interface IconButtonProps {
  active?: boolean;
  badge?: string;
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick?: () => void;
  size?: string;
  tooltipSide?: "left" | "top";
}

export function ProjectIconButton({
  active,
  badge,
  children,
  disabled = false,
  label,
  onClick,
  size = "size-12",
  tooltipSide = "top",
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            aria-label={label}
            className="group relative flex size-12 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
            disabled={disabled}
            onClick={onClick}
            type="button"
          />
        }
      >
        <span
          className={cn(
            "flex items-center justify-center rounded-full border border-border-subtle bg-surface text-copy transition group-hover:border-border-strong",
            size,
            active && "border-border-strong bg-heading text-canvas",
            disabled && "border-border-subtle/60 bg-surface-muted/40 text-copy-secondary/45 group-hover:border-border-subtle/60",
          )}
        >
          {children}
        </span>
        {badge ? (
          <span className="m3-label-small absolute -right-1 -top-1 min-w-5 rounded-full border-2 border-surface bg-brand px-1 text-center text-on-brand">
            {badge}
          </span>
        ) : null}
      </TooltipTrigger>
      <TooltipContent side={tooltipSide} sideOffset={10}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

interface ModalProps {
  children: ReactNode;
  closeLabel: string;
  onClose: () => void;
}

export function ProjectModal({ children, closeLabel, onClose }: ModalProps) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[140] flex items-center justify-center bg-action-ink/55 px-5 backdrop-blur-[2px]"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-h-[calc(100dvh_-_2.5rem)] w-full max-w-[500px] overflow-y-auto rounded-[var(--radius-dialog)] bg-surface-raised p-8 text-copy shadow-[var(--shadow-dialog)] m3-medium:p-10"
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <button
          aria-label={closeLabel}
          className="absolute right-6 top-5 flex size-12 items-center justify-center rounded-full hover:bg-surface-muted active:translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

// Mengubah identifier menjadi label yang mudah dibaca
export const formatProjectLabel = (value: string) =>
  value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());

// Menyingkat jumlah view dan like yang besar
export const formatProjectCount = (value: number) =>
  value >= 1000
    ? `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`
    : `${value}`;

// Mengganti placeholder pada copy terjemahan
export const formatProjectText = (
  template: string,
  values: Record<string, string | number>,
) =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );
