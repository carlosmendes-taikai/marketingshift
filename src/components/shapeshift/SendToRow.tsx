"use client";

import { CalendarPlus, Check, LoaderCircle, Sheet } from "lucide-react";
import { useState } from "react";
import { registry } from "@/components/intents/registry";
import { Button } from "@/components/ui/button";
import { eventCalendarUrl, reminderCalendarUrl } from "@/lib/connectors/googleCalendar";
import type { CardIntent } from "@/lib/jev/types";
import { notify } from "@/lib/notify";
import type { ParsedMap } from "@/lib/parse";

type Props<K extends CardIntent> = { intent: K; data: ParsedMap[K]; text: string };

function calendarUrl<K extends CardIntent>(intent: K, data: ParsedMap[K]) {
  if (intent === "event") return eventCalendarUrl(data as ParsedMap["event"]);
  if (intent === "reminder") return reminderCalendarUrl(data as ParsedMap["reminder"]);
  return null;
}

/** Hand the current card to another app. Each connector is one button. */
export function SendToRow<K extends CardIntent>({ intent, data, text }: Props<K>) {
  const [sheets, setSheets] = useState<"idle" | "sending" | "sent">("idle");
  const calendar = calendarUrl(intent, data);

  async function sendToSheets() {
    setSheets("sending");
    const def = registry[intent];
    try {
      const res = await fetch("/api/send/sheets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intent, label: def.label, summary: def.summary(data), text, data }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: null }));
        throw new Error(error ?? "Could not reach Google Sheets");
      }
      setSheets("sent");
      notify("Added a row to Google Sheets", { id: "sheets" });
      setTimeout(() => setSheets("idle"), 2000);
    } catch (err) {
      setSheets("idle");
      notify(err instanceof Error ? err.message : "Could not reach Google Sheets", { lead: "Not sent.", id: "sheets" });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] font-medium text-muted-foreground">Send to</span>
      {calendar && (
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <a href={calendar} target="_blank" rel="noopener noreferrer">
            <CalendarPlus aria-hidden />
            Add to Google Calendar
          </a>
        </Button>
      )}
      <Button variant="outline" size="sm" className="rounded-full" onClick={sendToSheets} disabled={sheets === "sending"}>
        {sheets === "sending" ? (
          <LoaderCircle aria-hidden className="animate-spin" />
        ) : sheets === "sent" ? (
          <Check aria-hidden />
        ) : (
          <Sheet aria-hidden />
        )}
        {sheets === "sent" ? "Added" : "Send to Google Sheets"}
      </Button>
    </div>
  );
}
