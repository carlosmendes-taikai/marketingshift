"use client";

import { CalendarPlus, Check, LoaderCircle, Settings2, Sheet } from "lucide-react";
import { useState } from "react";
import { registry } from "@/components/intents/registry";
import { Button } from "@/components/ui/button";
import { eventCalendarUrl, leadCalendarUrl, reminderCalendarUrl } from "@/lib/connectors/googleCalendar";
import { getSheetsUrl } from "@/lib/connectors/sheetsLink";
import type { CardIntent } from "@/lib/jev/types";
import { notify } from "@/lib/notify";
import type { ParsedMap } from "@/lib/parse";
import { SheetsSetupDialog } from "./SheetsSetupDialog";

type Props<K extends CardIntent> = { intent: K; data: ParsedMap[K]; text: string };

/** Dates as the sender's local wall time ("Wed, Sep 30, 2026, 3:00 PM"), not UTC, so the sheet shows the right day. */
function localDates(this: unknown, key: string, value: unknown) {
  const raw = (this as Record<string, unknown>)[key];
  if (!(raw instanceof Date)) return value;
  const midnight = raw.getHours() === 0 && raw.getMinutes() === 0;
  return raw.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(midnight ? {} : { hour: "numeric", minute: "2-digit" }),
  });
}

/** Clicking a button keeps the caret in the main input, so Enter, Esc and "/" keep working. */
const keepFocus = (e: React.MouseEvent) => e.preventDefault();

function calendarUrl<K extends CardIntent>(intent: K, data: ParsedMap[K]) {
  if (intent === "event") return eventCalendarUrl(data as ParsedMap["event"]);
  if (intent === "reminder") return reminderCalendarUrl(data as ParsedMap["reminder"]);
  if (intent === "lead") return leadCalendarUrl(data as ParsedMap["lead"]);
  return null;
}

/** Hand the current card to another app. Each connector is one button. */
export function SendToRow<K extends CardIntent>({ intent, data, text }: Props<K>) {
  const [sheets, setSheets] = useState<"idle" | "sending" | "sent">("idle");
  // Rendered only in the browser (cards appear after typing), so reading storage here is safe.
  const [connected, setConnected] = useState(() => getSheetsUrl() !== null);
  const [setupOpen, setSetupOpen] = useState(false);
  const calendar = calendarUrl(intent, data);

  async function sendToSheets(url = getSheetsUrl()) {
    if (!url) {
      setSetupOpen(true);
      return;
    }
    setSheets("sending");
    const def = registry[intent];
    try {
      const res = await fetch("/api/send/sheets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, intent, label: def.label, summary: def.summary(data), text, data }, localDates),
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
          <a href={calendar} target="_blank" rel="noopener noreferrer" onMouseDown={keepFocus}>
            <CalendarPlus aria-hidden />
            Add to Google Calendar
          </a>
        </Button>
      )}
      <Button variant="outline" size="sm" className="rounded-full" onMouseDown={keepFocus} onClick={() => sendToSheets()} disabled={sheets === "sending"}>
        {sheets === "sending" ? (
          <LoaderCircle aria-hidden className="animate-spin" />
        ) : sheets === "sent" ? (
          <Check aria-hidden />
        ) : (
          <Sheet aria-hidden />
        )}
        {sheets === "sent" ? "Added" : connected ? "Send to Google Sheets" : "Connect Google Sheets"}
      </Button>
      {connected && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full text-muted-foreground"
          onMouseDown={keepFocus}
          onClick={() => setSetupOpen(true)}
          aria-label="Change or disconnect your Google Sheet"
          title="Change or disconnect your Google Sheet"
        >
          <Settings2 aria-hidden />
        </Button>
      )}
      <SheetsSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onSaved={(url) => {
          setSetupOpen(false);
          setConnected(url !== null);
          if (url) sendToSheets(url);
          else notify("Google Sheet disconnected", { id: "sheets" });
        }}
      />
    </div>
  );
}
