"use client";

import { useContext } from "react";
import { CONTENT_FORMATS } from "@/lib/jev/types";
import type { IdeaData } from "@/lib/parse/idea";
import { FORMAT_LABEL, withFormat } from "@/lib/parse/marketing";
import { cn } from "@/lib/utils";
import { DraftContext, Field, Meta, Missing } from "./shared";
import type { CardProps } from "./types";

export function IdeaCard({ data, signals, interactive }: CardProps<IdeaData>) {
  const draft = useContext(DraftContext);
  // Named in the text wins; otherwise Jev's pick. Clicking writes the choice into the text.
  const format = data.format ?? signals.contentFormat;
  const suggested = !data.format && format;

  return (
    <div className="flex flex-col gap-3">
      <Field index={0}>
        {data.idea ? (
          <h2 className="text-[17px] leading-6 font-[550] tracking-[-0.01em] text-pretty break-words">{data.idea}</h2>
        ) : (
          <Missing>What is the idea?</Missing>
        )}
      </Field>
      <Field index={1}>
        <Options
          label="Format"
          values={CONTENT_FORMATS}
          labels={FORMAT_LABEL}
          selected={format}
          disabled={!interactive || !draft}
          onPick={(f) => draft?.rewrite((t) => withFormat(t, f))}
        />
      </Field>
      {suggested && interactive && (
        <Field index={2}>
          <Meta>Suggested by Jev. Click to change.</Meta>
        </Field>
      )}
    </div>
  );
}

function Options<T extends string>({
  label,
  values,
  labels,
  selected,
  disabled,
  onPick,
}: {
  label: string;
  values: readonly T[];
  labels: Record<T, string>;
  selected: T | null;
  disabled: boolean;
  onPick: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span className="w-16 shrink-0 text-[13px] font-medium text-muted-foreground">{label}</span>
      {values.map((v) => {
        const on = v === selected;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => !on && onPick(v)}
            className={cn(
              "inline-flex h-7 items-center rounded-full border px-2.5 text-[13px] font-medium transition-[background-color,border-color,color,scale] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring enabled:active:scale-[0.96]",
              on
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-ink-2 enabled:hover:border-muted-foreground enabled:hover:text-foreground",
            )}
          >
            {labels[v]}
          </button>
        );
      })}
    </div>
  );
}
