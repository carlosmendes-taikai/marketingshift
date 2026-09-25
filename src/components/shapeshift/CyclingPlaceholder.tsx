"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { tween } from "@/lib/motion";

const EXAMPLES = [
  "linkedin campaign spring launch acme.com/launch",
  "post about how we doubled our newsletter signups",
  "met Ana from Acme, interested in a product demo",
  "linkedin ads 500 spent, 12k impressions, 340 clicks, 25 leads",
  "promote our spring webinar on nov 15",
  'subject: "Your monthly recap" vs "3 ideas that doubled our signups"',
  "paste a LinkedIn draft to grade it",
  "call with the design team tuesday 3pm on meet",
  "remind me to send the newsletter friday 9am",
  "launch checklist: brief, visuals, landing page, emails",
  "newsletter campaign monthly recap acme.com/blog",
  "carousel about 5 lessons from our first conference",
  "25 min focus",
  "3pm lisbon in new york",
];

export function CyclingPlaceholder() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    // Auto-rotating text is autoplay: reduced motion keeps the first example still.
    if (reduce) return;
    const id = setInterval(() => setI((n) => (n + 1) % EXAMPLES.length), 2800);
    return () => clearInterval(id);
  }, [reduce]);
  return (
    <span aria-hidden className="pointer-events-none absolute inset-y-0 start-5 end-5 flex items-center overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.span
          key={i}
          className="absolute truncate text-[22px] leading-8 font-[450] tracking-[-0.01em] text-muted-foreground"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={reduce ? tween.fade : tween.crossfade}
        >
          {EXAMPLES[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
