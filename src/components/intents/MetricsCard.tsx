"use client";

import { formatCount, formatMoney, type MetricsData } from "@/lib/parse/metrics";
import { Chip, Field, HeroNumber, Meta, Missing } from "./shared";
import type { CardProps } from "./types";

const pct = (n: number) => `${n < 1 ? n.toFixed(2) : n.toFixed(1)}%`;

export function MetricsCard({ data }: CardProps<MetricsData>) {
  const money = (n: number) => formatMoney(n, data.currency);
  const results = [
    { label: "Click rate", value: data.ctr, format: pct },
    { label: "Cost per click", value: data.cpc, format: money },
    { label: "Cost per lead", value: data.cpl, format: money },
    { label: "Conversion", value: data.conversion, format: pct },
    { label: "Cost per 1,000 views", value: data.cpm, format: money },
  ].filter((r) => r.value !== null && Number.isFinite(r.value));

  const inputs = [
    data.spend !== null && `${money(data.spend)} spent`,
    data.impressions !== null && `${formatCount(data.impressions)} impressions`,
    data.clicks !== null && `${formatCount(data.clicks)} clicks`,
    data.leads !== null && `${formatCount(data.leads)} leads`,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-3">
      <Field index={0} className="flex flex-wrap gap-1.5">
        {data.channel && <Chip>{data.channel}</Chip>}
        {inputs.length ? inputs.map((i) => <Chip key={i}>{i}</Chip>) : <Missing>Add numbers, like “500 spent, 12k impressions, 340 clicks”</Missing>}
      </Field>
      {results.length > 0 ? (
        <Field index={1} className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          {results.map((r) => (
            <div key={r.label} className="flex flex-col gap-0.5">
              <HeroNumber className="text-[24px] leading-7">{r.format(r.value!)}</HeroNumber>
              <Meta>{r.label}</Meta>
            </div>
          ))}
        </Field>
      ) : (
        inputs.length > 0 && (
          <Field index={1}>
            <Missing className="text-[14px]">Add one more number, like clicks or leads, to see the rates</Missing>
          </Field>
        )
      )}
    </div>
  );
}
