"use client";

import { Building2, CalendarClock, Mail, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { LeadData } from "@/lib/parse/lead";
import { Chip, Field, formatWhen, Missing } from "./shared";
import type { CardProps } from "./types";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export function LeadCard({ data }: CardProps<LeadData>) {
  const when = formatWhen(data.followUp, data.followUpHasTime);
  const day = when.day === "Today" || when.day === "Tomorrow" ? when.day.toLowerCase() : when.day;
  return (
    <div className="flex items-start gap-4">
      <Field index={0}>
        <Avatar className="size-12">
          <AvatarFallback className="bg-secondary text-[15px] font-semibold text-ink-2">{initials(data.name) || "?"}</AvatarFallback>
        </Avatar>
      </Field>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Field index={1}>
          {data.name ? <h2 className="text-[17px] leading-6 font-[550] break-words">{data.name}</h2> : <Missing>Who did you meet?</Missing>}
        </Field>
        <Field index={2} className="flex flex-col divide-y divide-border/70">
          <Row icon={Building2} value={data.company} placeholder="No company yet" />
          <Row icon={Sparkles} value={data.interest} placeholder="No interest yet" />
          {data.guests.length > 0 && <Row icon={Mail} value={data.guests.join(", ")} placeholder="" />}
        </Field>
        <Field index={3}>
          <Chip icon={CalendarClock}>
            Follow up {when.time ? `${day}, ${when.time}` : day}
            {!data.followUpSet && <span className="text-muted-foreground">(in 3 working days)</span>}
          </Chip>
        </Field>
      </div>
    </div>
  );
}

function Row({ icon: Icon, value, placeholder }: { icon: typeof Building2; value: string | null; placeholder: string }) {
  return (
    <div className="flex min-h-9 items-center gap-2.5 py-1.5 text-[15px]">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      {value ? <span className="min-w-0 break-words">{value}</span> : <span className="text-muted-foreground">{placeholder}</span>}
    </div>
  );
}
