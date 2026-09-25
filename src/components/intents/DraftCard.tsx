"use client";

import { Bot, LoaderCircle, Magnet, RotateCcw, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useGrade } from "@/hooks/useGrade";
import { AUDIENCE_LABEL, CONFIDENCE_FLOOR, type PostGrade } from "@/lib/jev/gradeTypes";
import { type DraftData, LINKEDIN_MAX_CHARS, seeMorePreview } from "@/lib/parse/draft";
import { cn } from "@/lib/utils";
import { Chip, Field, Meta, Missing } from "./shared";
import type { CardProps } from "./types";

const MIN_WORDS = 12;

export function DraftCard({ data, interactive }: CardProps<DraftData>) {
  const request = data.linkedinUrl
    ? { type: "post", post: data.linkedinUrl }
    : data.words >= MIN_WORDS
      ? { type: "post", post: data.post }
      : null;
  const grade = useGrade<PostGrade>(request, interactive);
  // A LinkedIn link shows the fetched post once it arrives.
  const post = data.linkedinUrl ? (grade.result?.post ?? "") : data.post;
  const preview = data.linkedinUrl ? (post ? seeMorePreview(post) : null) : data.preview;
  const chars = post.length;

  return (
    <div className="flex flex-col gap-3">
      <Field index={0} className="flex flex-wrap gap-1.5">
        {data.linkedinUrl && !post ? (
          <Chip>LinkedIn link</Chip>
        ) : (
          <>
            <Chip className={chars > LINKEDIN_MAX_CHARS ? "text-caution-text" : undefined}>
              {chars.toLocaleString("en-US")} / {LINKEDIN_MAX_CHARS.toLocaleString("en-US")} characters
            </Chip>
            {!data.linkedinUrl && <Chip>{data.words} words</Chip>}
            {!data.linkedinUrl && <Chip>{data.readingSeconds < 60 ? `${data.readingSeconds} sec read` : `${Math.round(data.readingSeconds / 60)} min read`}</Chip>}
            {data.hashtags > 0 && <Chip>{data.hashtags} hashtag{data.hashtags === 1 ? "" : "s"}</Chip>}
          </>
        )}
      </Field>

      {preview && (
        <Field index={1} className="flex flex-col gap-1 rounded-md bg-secondary px-3 py-2.5">
          <Meta>In the feed</Meta>
          <p className="text-[14px] leading-5 whitespace-pre-line text-ink-2">
            {preview}
            <span className="text-muted-foreground"> …see more</span>
          </p>
        </Field>
      )}

      <Field index={2} className="flex flex-col divide-y divide-border/70">
        {!request ? (
          <Missing className="py-1.5 text-[14px]">Paste a full draft or a LinkedIn post link and Jev will grade it</Missing>
        ) : grade.status === "error" ? (
          <div className="flex items-center justify-between gap-3 py-1.5">
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
        ) : !grade.result ? (
          <p className="flex items-center gap-2 py-1.5 text-[14px] text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            {interactive ? "Jev is reading your post" : "Jev will grade this post"}
          </p>
        ) : (
          <>
            <Row icon={Magnet} label="Hook strength" confidence={grade.result.hook.confidence}>
              <Dots value={grade.result.hook.score} />
              <span className="font-medium">{grade.result.hook.label}</span>
            </Row>
            <Row icon={Users} label="Audience" confidence={grade.result.audience.confidence}>
              <span className="font-medium">{AUDIENCE_LABEL[grade.result.audience.choice]}</span>
            </Row>
            <Row icon={Bot} label="Sounds AI-written" confidence={grade.result.soundsAi.confidence}>
              <span className={cn("font-medium", grade.result.soundsAi.probability >= 0.5 && "text-caution-text")}>
                {grade.result.soundsAi.probability >= 0.5 ? "Yes" : "No"}
              </span>
              <span className="text-muted-foreground tabular-nums">{Math.round(grade.result.soundsAi.probability * 100)}%</span>
            </Row>
          </>
        )}
      </Field>
    </div>
  );
}

function Row({ icon: Icon, label, confidence, children }: { icon: typeof Bot; label: string; confidence: number; children: ReactNode }) {
  return (
    <div className="flex min-h-10 items-center gap-2.5 py-1.5 text-[14px]">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="text-ink-2">{label}</span>
      <span className="ms-auto flex items-center gap-2">
        {confidence < CONFIDENCE_FLOOR && (
          <span title={`Jev is ${Math.round(confidence * 100)}% confident`} className="text-[12px] text-muted-foreground">
            Not sure
          </span>
        )}
        {children}
      </span>
    </div>
  );
}

/** Five dots, filled up to the 1 to 5 score. */
function Dots({ value }: { value: number }) {
  return (
    <span aria-hidden className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={cn("size-1.5 rounded-full", n <= Math.round(value) ? "bg-foreground" : "bg-line-strong")} />
      ))}
    </span>
  );
}
