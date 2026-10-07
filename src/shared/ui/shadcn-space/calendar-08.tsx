"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import type { Locale } from "react-day-picker";

import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Card, CardContent, CardFooter } from "@/shared/ui/card";

export type Calendar08Event = {
  title: string;
  from: string;
  to: string;
  color?: "blue" | "teal" | "orange";
};

type Calendar08Props = {
  events?: Calendar08Event[];
  locale?: Locale;
  localeCode?: string;
  emptyLabel?: string;
  addEventLabel?: string;
  className?: string;
};

const colorMap = {
  blue: { dot: "bg-chart-4", bg: "bg-chart-4/10", time: "text-chart-4" },
  teal: { dot: "bg-chart-1", bg: "bg-chart-1/10", time: "text-chart-1" },
  orange: {
    dot: "bg-chart-3",
    bg: "bg-chart-3/10",
    time: "text-chart-3",
  },
} as const;

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatTimeRange(from: Date, to: Date, localeCode: string) {
  const timeFmt = new Intl.DateTimeFormat(localeCode, {
    hour: "numeric",
    minute: "2-digit",
  });
  const dateFmt = new Intl.DateTimeFormat(localeCode, {
    month: "short",
    day: "numeric",
  });
  if (isSameDay(from, to)) {
    return `${timeFmt.format(from)} – ${timeFmt.format(to)}`;
  }
  return `${dateFmt.format(from)} – ${dateFmt.format(to)}`;
}

// Desain dan anatomy mengikuti registry @shadcn-space/calendar-08.
export function Calendar08({
  events = [],
  locale,
  localeCode = "en-US",
  emptyLabel = "No events on this date.",
  addEventLabel = "Add Event",
  className,
}: Calendar08Props) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const selectedEvents = useMemo(
    () =>
      date
        ? events.filter((event) => isSameDay(new Date(event.from), date))
        : [],
    [date, events],
  );

  return (
    <Card
      className={`h-full min-w-0 border-border-subtle bg-surface-container-low pt-4 text-copy ${className ?? ""}`}
    >
      <CardContent className="px-4">
        <Calendar
          className="w-full bg-transparent p-0"
          locale={locale}
          mode="single"
          onSelect={setDate}
          required
          selected={date}
        />
      </CardContent>
      <CardFooter className="flex flex-1 flex-col items-start gap-3 border-t border-border-subtle bg-surface-container-low">
        <div className="flex w-full items-center justify-between px-1">
          <div className="dashboard-card-title">
            {date?.toLocaleDateString(localeCode, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <Button
            aria-disabled="true"
            className="size-6"
            size="icon"
            title={addEventLabel}
            variant="ghost"
          >
            <PlusIcon />
            <span className="sr-only">{addEventLabel}</span>
          </Button>
        </div>
        <div className="flex w-full flex-col gap-2">
          {selectedEvents.length ? (
            selectedEvents.slice(0, 3).map((event, index) => {
              const color =
                event.color ?? (["blue", "teal", "orange"] as const)[index % 3];
              const styles = colorMap[color];
              return (
                <div
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-opacity hover:opacity-80 ${styles.bg}`}
                  key={`${event.from}-${event.title}-${index}`}
                >
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${styles.dot}`}
                  />
                  <span className="dashboard-body flex-1 truncate !font-medium !text-heading">
                    {event.title}
                  </span>
                  <span
                    className={`dashboard-table-label shrink-0 ${styles.time}`}
                  >
                    {formatTimeRange(
                      new Date(event.from),
                      new Date(event.to || event.from),
                      localeCode,
                    )}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="dashboard-body px-1 py-2">{emptyLabel}</p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
