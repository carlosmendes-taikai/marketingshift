"use client";

import { LoaderCircle, RotateCcw, Trophy } from "lucide-react";
import { useGrade } from "@/hooks/useGrade";
import { CONFIDENCE_FLOOR, type OptionsGrade } from "@/lib/jev/gradeTypes";
import { AB_KIND_LABEL, type AbTestData } from "@/lib/parse/abtest";
import { cn } from "@/lib/utils";
import { Chip, Field, Meta, Missing } from "./shared";
import type { CardProps } from "./types";

const LETTER = ["A", "B", "C", "D"];

export function AbTestCard({ data, interactive }: CardProps<AbTestData>) {
  const request = data.options.length >= 2 ? { type: "options", kind: data.kind, options: data.options } : null;
  const grade = useGrade<OptionsGrade>(request, interactive, 700);
  const result = grade.result;

  return (
    <div className="flex flex-col gap-3">
      <Field index={0}>
        <Chip>{AB_KIND_LABEL[data.kind]}</Chip>
      </Field>
      <Field index={1} className="flex flex-col gap-2">
        {data.options.length === 0 && <Missing>Add options, like “Your recap” vs “3 ideas that doubled our signups”</Missing>}
        {data.options.map((o, i) => {
          const r = result?.options[i];
          const won = result?.winner === i;
          return (
            <div key={i} className={cn("flex flex-col gap-1.5 rounded-md border px-3 py-2.5", won ? "border-foreground" : "border-border")}>
              <div className="flex items-start gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-[12px] font-semibold text-ink-2">{LETTER[i]}</span>
                <p className="min-w-0 flex-1 text-[15px] leading-[22px] text-pretty break-words">{o}</p>
                {won && <Trophy className="mt-0.5 size-4 shrink-0" aria-label="Winner" />}
              </div>
              {r && (
                <div className="flex items-center gap-2 ps-8">
                  <span className="relative h-1.5 flex-1 rounded-full bg-secondary">
                    <span className="absolute inset-y-0 left-0 rounded-full bg-foreground" style={{ width: `${Math.round(r.winProbability * 100)}%` }} />
                  </span>
                  <span className="w-10 text-right text-[12px] font-medium tabular-nums">{Math.round(r.winProbability * 100)}%</span>
                  <Meta className="w-20 text-right">{r.label}</Meta>
                </div>
              )}
            </div>
          );
        })}
        {data.options.length === 1 && <Missing className="text-[14px]">Add a second option with “vs”</Missing>}
      </Field>
      {request && (
        <Field index={2}>
          {grade.status === "error" ? (
            <div className="flex items-center justify-between gap-3">
              <Missing className="text-[14px]">{grade.error}</Missing>
              {interactive && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={grade.retry}
                  className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[13px] font-medium text-ink-2 hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                  Try again
                </button>
              )}
            </div>
          ) : !result ? (
            <p className="flex items-center gap-2 text-[14px] text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              {interactive ? "Jev is comparing the options" : "Jev will pick a winner"}
            </p>
          ) : (
            <Meta>
              {result.confidence < CONFIDENCE_FLOOR ? "Close call. Worth a real A/B test." : `Jev picks option ${LETTER[result.winner]}.`}
            </Meta>
          )}
        </Field>
      )}
    </div>
  );
}
