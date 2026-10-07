"use client";

import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

type Table01Props = {
  children: ReactNode;
  count: number;
  hasNextPage: boolean;
  labels: {
    next: string;
    previous: string;
    show: string;
    showing: string;
  };
  loading?: boolean;
  offset: number;
  pageSize: number;
  onNext: () => void;
  onPageSizeChange: (value: number) => void;
  onPrevious: () => void;
};

// Adapted from @shadcn-space/table-01: its visual shell is retained while
// project-specific mock columns, avatars, progress bars, and actions are omitted.
export function Table01({
  children,
  count,
  hasNextPage,
  labels,
  loading = false,
  offset,
  pageSize,
  onNext,
  onPageSizeChange,
  onPrevious,
}: Table01Props) {
  const first = count > 0 ? offset + 1 : 0;
  const last = offset + count;

  return (
    <div className="flex min-h-0 flex-1 flex-col p-[var(--dashboard-frame)] pt-0">
      <div className="flex flex-wrap items-center justify-between gap-3 py-5">
        <div className="dashboard-body flex items-center gap-2 !text-copy">
          <span>{labels.show}</span>
          <Select
            disabled={loading}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            value={String(pageSize)}
          >
            <SelectTrigger
              aria-label={labels.show}
              className="h-10 min-w-20 rounded-[var(--radius-control)] border-border-subtle bg-surface-container px-3"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {[5, 10, 20].map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        aria-busy={loading}
        className="overflow-hidden rounded-[var(--radius-control)] border border-border-subtle bg-surface-container-low text-copy [&_th]:type-label [&_th]:font-medium [&_th]:text-copy-secondary [&_td]:type-body [&_td]:text-copy"
      >
        {children}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <p className="dashboard-body">
          {labels.showing
            .replace("{first}", String(first))
            .replace("{last}", String(last))}
        </p>
        <div className="flex items-center gap-2">
          <Button
            className="!h-10 !min-h-10 px-4"
            disabled={loading || offset === 0}
            onClick={onPrevious}
            type="button"
            variant="outline"
          >
            {labels.previous}
          </Button>
          <span className="dashboard-body grid size-10 place-items-center rounded-[var(--radius-control)] bg-action-ink !text-on-dark">
            {Math.floor(offset / pageSize) + 1}
          </span>
          <Button
            className="!h-10 !min-h-10 px-4"
            disabled={loading || !hasNextPage}
            onClick={onNext}
            type="button"
            variant="outline"
          >
            {labels.next}
          </Button>
        </div>
      </div>
    </div>
  );
}
