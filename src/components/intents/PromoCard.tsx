"use client";

import { CalendarPlus, Check } from "lucide-react";
import { googleCalendarUrl } from "@/lib/connectors/googleCalendar";
import type { PromoData } from "@/lib/parse/promo";
import { cn } from "@/lib/utils";
import { Chip, Field, formatWhen, Meta, Missing } from "./shared";
import type { CardProps } from "./types";

const day = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export function PromoCard({ data, interactive }: CardProps<PromoData>) {
  return (
    <div className="flex flex-col gap-3">
      <Field index={0} className="flex flex-wrap items-center justify-between gap-2">
        {data.name ? (
          <h2 className="text-[17px] leading-6 font-[550] tracking-[-0.01em] text-pretty break-words">{data.name}</h2>
        ) : (
          <Missing>Which event?</Missing>
        )}
        {data.date ? <Chip>{formatWhen(data.date, false).day}</Chip> : <Chip className="text-muted-foreground">No date yet</Chip>}
      </Field>
      {data.steps.length > 0 && (
        <Field index={1}>
          <ol className="flex flex-col">
            {data.steps.map((s) => (
              <li key={s.id} className={cn("flex items-center gap-3 border-b border-border/70 py-2 last:border-0", s.past && "opacity-50")}>
                <span className="w-24 shrink-0 text-[13px] font-medium tabular-nums text-muted-foreground">{day(s.date)}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[14px] font-medium">{s.label}</span>
                  <Meta className="text-pretty">{s.hint}</Meta>
                </span>
                {s.past ? (
                  <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                    <Check className="size-3.5" aria-hidden />
                    Past
                  </span>
                ) : (
                  interactive && (
                    <a
                      href={googleCalendarUrl({
                        title: `${s.label}: ${data.name || "event"}`,
                        start: s.date,
                        hasTime: false,
                        minutes: 0,
                        details: s.hint,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseDown={(e) => e.preventDefault()}
                      aria-label={`Add "${s.label}" to Google Calendar`}
                      title="Add to Google Calendar"
                      className="grid size-8 shrink-0 place-items-center rounded-full border text-ink-2 transition-colors hover:text-foreground"
                    >
                      <CalendarPlus className="size-4" aria-hidden />
                    </a>
                  )
                )}
              </li>
            ))}
          </ol>
        </Field>
      )}
    </div>
  );
}
