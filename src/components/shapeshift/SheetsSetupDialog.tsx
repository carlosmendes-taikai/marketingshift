"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { APPS_SCRIPT, getSheetsUrl, SHEETS_URL_RE, setSheetsUrl } from "@/lib/connectors/sheetsLink";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the saved link, or null after disconnecting. */
  onSaved: (url: string | null) => void;
};

/** Five-minute, free setup: the visitor's own sheet, their own Apps Script, the link kept in their browser. */
export function SheetsSetupDialog({ open, onOpenChange, onSaved }: Props) {
  const current = open ? getSheetsUrl() : null;
  const [value, setValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy. Select the script below and copy it by hand.");
    }
  };

  const save = () => {
    const url = value.trim();
    if (!SHEETS_URL_RE.test(url)) {
      setError("That doesn't look like a web app link. It starts with https://script.google.com/macros/s/ and ends with /exec");
      return;
    }
    setSheetsUrl(url);
    setValue("");
    setError(null);
    onSaved(url);
  };

  const disconnect = () => {
    setSheetsUrl(null);
    onSaved(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-0 sm:max-w-[520px] [&>*]:min-w-0">
        <DialogHeader>
          <DialogTitle>Connect your Google Sheet</DialogTitle>
          <DialogDescription>
            Cards are added as rows to your own sheet. It takes about five minutes, it’s free, and the link is saved in this browser only.
          </DialogDescription>
        </DialogHeader>

        <ol className="flex min-w-0 list-decimal flex-col gap-2.5 ps-5 text-[14px] leading-5 text-ink-2 marker:text-muted-foreground">
          <li>
            Open a new sheet at{" "}
            <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline underline-offset-2">
              sheets.new
            </a>
            .
          </li>
          <li className="min-w-0">
            <span>
              Go to <b className="font-medium text-foreground">Extensions, then Apps Script</b>. Replace the code with this script and save.
            </span>
            <div className="relative mt-2 min-w-0 rounded-md bg-secondary">
              <pre className="max-h-28 w-full overflow-auto p-3 pe-24 [font-variant-ligatures:none] font-mono text-[11px] leading-4 text-ink-2 select-all">{APPS_SCRIPT}</pre>
              <Button size="sm" variant="outline" className="absolute end-2 top-2 rounded-full" onClick={copyScript}>
                {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </li>
          <li>
            Click <b className="font-medium text-foreground">Deploy, then New deployment</b>, choose <b className="font-medium text-foreground">Web app</b>, set
            access to <b className="font-medium text-foreground">Anyone</b> and deploy. Google will warn that the app isn’t verified: it’s your own
            script, so choose Advanced, then Go to the project.
          </li>
          <li className="min-w-0">
            <span className="mb-2 block">Paste the web app link here.</span>
            <Input
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="https://script.google.com/macros/s/…/exec"
              aria-invalid={error ? true : undefined}
              className="font-mono text-[12px]"
            />
            {error && <span className="mt-1.5 block text-[13px] text-destructive">{error}</span>}
          </li>
        </ol>

        <p className="text-[12px] leading-4 text-muted-foreground">
          “Anyone” only lets the link add rows. Nobody can read your sheet through it, and the script can only touch this one sheet.
        </p>

        <DialogFooter className="gap-2 sm:justify-between">
          {current ? (
            <Button variant="ghost" size="sm" onClick={disconnect}>
              Disconnect current sheet
            </Button>
          ) : (
            <span />
          )}
          <Button size="sm" className="rounded-full px-4" onClick={save} disabled={!value.trim()}>
            Save and send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
