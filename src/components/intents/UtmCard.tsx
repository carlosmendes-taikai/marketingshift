"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import type { UtmData } from "@/lib/parse/utm";
import { Chip, Field, Meta, Missing } from "./shared";
import type { CardProps } from "./types";

export function UtmCard({ data, interactive }: CardProps<UtmData>) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!data.tagged) return;
    try {
      await navigator.clipboard.writeText(data.tagged);
      setCopied(true);
      notify("Link copied", { id: "utm-copy" });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      notify("Select the link and copy it by hand", { lead: "Could not copy.", id: "utm-copy" });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field index={0} className="flex flex-wrap gap-1.5">
        <Tag name="Source" value={data.source} />
        <Tag name="Medium" value={data.medium} />
        <Tag name="Campaign" value={data.campaign} />
        {data.content && <Tag name="Content" value={data.content} />}
      </Field>
      <Field index={1} className="flex items-start gap-2 rounded-md bg-secondary px-3 py-2.5">
        {data.tagged ? (
          <p className="min-w-0 flex-1 font-mono text-[12px] leading-[18px] break-all select-all">{data.tagged}</p>
        ) : (
          <Missing className="flex-1 text-[13px] leading-[18px]">
            {!data.url ? "Add the destination, e.g. acme.com/launch" : "Add a source, e.g. linkedin or newsletter"}
          </Missing>
        )}
        {interactive && data.tagged && (
          <Button size="sm" variant="outline" className="shrink-0 rounded-full" onMouseDown={(e) => e.preventDefault()} onClick={copy}>
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </Button>
        )}
      </Field>
      {data.url && !data.tagged && (
        <Field index={2}>
          <Meta className="font-mono text-[12px] break-all">{data.url.replace(/^https?:\/\//, "")}</Meta>
        </Field>
      )}
    </div>
  );
}

function Tag({ name, value }: { name: string; value: string | null }) {
  return (
    <Chip className={value ? undefined : "text-muted-foreground"}>
      <span className="text-muted-foreground">{name}</span>
      {value ?? "not set"}
    </Chip>
  );
}
