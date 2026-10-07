import type { ComponentType } from "react";
import { Plus, X } from "lucide-react";
import { useT } from "@/shared/providers/language-provider";

interface InsertContentSlotProps<Kind extends string> {
  active: boolean;
  items: Array<{
    kind: Kind;
    label: string;
    Icon: ComponentType<{ className?: string }>;
  }>;
  onActivate: () => void;
  onClose: () => void;
  onSelect: (kind: Kind) => void;
}

export function InsertContentSlot<Kind extends string>({
  active,
  items,
  onActivate,
  onClose,
  onSelect,
}: InsertContentSlotProps<Kind>) {
  const copy = useT().dashboardCreator.creatorStudio.editor;

  if (!active) {
    return (
      <div className="group relative z-20 flex min-h-10 w-full items-center justify-center">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-brand/0 transition-colors group-hover:bg-brand/30" />
        <button
          aria-label={copy.toolbar.insertHere}
          className="relative flex size-11 items-center justify-center rounded-full bg-action-ink text-on-dark shadow-[var(--shadow-control)] transition-transform hover:scale-110 hover:bg-action-ink/85 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
          onClick={onActivate}
          type="button"
        >
          <Plus className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative z-20 flex min-h-16 w-full items-center justify-center px-[var(--card-padding)]">
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-[var(--radius-pill)] bg-action-ink px-2 py-1.5 text-on-dark shadow-[var(--shadow-panel)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="m3-label-large shrink-0 px-3">
          {copy.toolbar.insertContent}
        </span>
        {items.map(({ kind, label, Icon }) => (
          <button
            aria-label={label}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-on-dark/80 hover:bg-on-dark/15 hover:text-on-dark focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
            key={kind}
            onClick={() => onSelect(kind)}
            title={label}
            type="button"
          >
            <Icon className="size-4" />
          </button>
        ))}
        <span className="mx-1 h-6 w-px shrink-0 bg-on-dark/15" />
        <button
          aria-label={copy.closeAddContent}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-on-dark/60 hover:bg-on-dark/15 hover:text-on-dark focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
