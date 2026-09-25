# Marketingshift

**One text box for a marketer's day.** Type a note and it turns into the right card as you type: an event, a reminder, a checklist, a poll and more.

Marketingshift is a fork of [Shapeshift](https://github.com/anishfn/shapeshift) by [anishfn](https://github.com/anishfn), released under the MIT license. All credit for the original idea, design and code goes to them.

<p align="center">
  <img src="docs/demo.gif" alt="Typing 'dinner with priya friday 8pm on zoom' morphs the text box into an event card, then a shopping checklist" width="820">
  <br>
  <sub>Demo of the original Shapeshift · <a href="docs/demo.mp4">Watch the full 60-second demo (1080p60)</a></sub>
</p>

```
linkedin campaign october hacker house taikai.network/hh2  →  UTM link · utm_source=linkedin&utm_medium=social…
post about how we ran hacker house with dehouse             →  Content idea · TAIKAI · LinkedIn post
met Ana from Sonae, interested in AI workshop               →  Lead · Ana, Sonae · follow up in 3 working days
call with the dehouse team tuesday 3pm on meet              →  Event · Tuesday · 3 PM · Google Meet
```

Intent is classified by [TypeSafe AI](https://typesafe.ai)'s **Jev** model, called through the [Vercel AI Gateway](https://vercel.com/ai-gateway) with the AI SDK's `experimental_evaluate`: one call answers 9 typed questions in parallel (which card, plus signals like "is it a video call?", "is it urgent?", "which brand should publish this idea?"). Everything else — dates, amounts, units, math — is deterministic code. **Jev decides, code computes.**

<p align="center"><img src="docs/diagrams/jev-fanout.svg" alt="One Jev call answers 14 questions in parallel; a deterministic parser reads the same text for values" width="820"></p>

It works **fully offline by default** with a built-in keyword classifier, so you can run it without an account.

## Quick start

Requires [Bun](https://bun.sh) 1.2+.

```bash
bun install
bun dev
```

Open http://localhost:3000 and start typing. Press <kbd>/</kbd> to see every card type.

### Use the online Jev model (optional)

```bash
cp .env.example .env.local
# then set AI_GATEWAY_API_KEY=... (Vercel dashboard → AI Gateway → API keys)
```

Restart `bun dev`. The latency readout in the bottom-right corner switches from `jev-offline` to `typesafe-ai/jev`. The key is only ever read on the server (`/api/intent`); it never reaches the browser. On Vercel, the project's OIDC token also works. If the gateway is unreachable, slow or rate-limited, Marketingshift quietly falls back to offline mode.

| Variable | Default | What it does |
| --- | --- | --- |
| `AI_GATEWAY_API_KEY` | _(empty)_ | Enables the online model via the Vercel AI Gateway. Empty or placeholder values keep you offline. |
| `JEV_MODEL` | `typesafe-ai/jev` | Model id on the AI Gateway. |
| `SHEETS_WEBHOOK_URL` | _(empty)_ | Google Sheets Apps Script web app URL for "Send to Google Sheets". |
| `NEXT_PUBLIC_USE_MOCK` | `false` | `true` forces offline even with a key. |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Used for Open Graph metadata. |

## Card types

| Card | Try |
| --- | --- |
| UTM link | `linkedin campaign october hacker house taikai.network/hh2` |
| Content idea | `post about how we ran hacker house with dehouse` |
| Lead | `met Ana from Sonae, interested in AI workshop` |
| Post draft | paste a LinkedIn draft, or a LinkedIn post link |
| Campaign results | `linkedin ads 500 spent, 12k impressions, 340 clicks, 25 leads` |
| Event promo plan | `promote hacker house on nov 15` |
| A/B test | `subject: "Your hacker house recap" vs "What 40 builders shipped in 48h"` |
| Event | `call with the dehouse team tuesday 3pm on meet` |
| Reminder | `remind me to send the newsletter friday urgent` |
| Checklist | `launch checklist: brief, visuals, landing page, emails` |
| Timer | `25 min focus` |
| Calculate | `18% of 3450` |
| Contact | `ana silva +351 912 345 678 ana@sonae.pt` |
| Bookmark | `https://vercel.com/blog check later` |
| Time zone | `3pm lisbon in new york`, `what time is it in tokyo` |

**UTM link** builds a tagged URL (source, medium, campaign, optional `content …`), lowercase with hyphens. Common sources map to a medium: LinkedIn, X, Instagram → `social`; newsletter → `email`; Google Ads → `cpc`.
**Content idea** shows the idea plus Jev's pick of brand (LayerX, TAIKAI, /ai-cmo) and format (LinkedIn post, carousel, article, video). Clicking another option writes it into the text ("… for TAIKAI as a carousel"), so the choice is saved with the card.
**Lead** shows name, company, interest and a follow-up date, three working days later unless you type one ("follow up monday").
**Post draft** is the post grader app folded in: a second Jev call (`/api/grade`) scores the hook, picks the audience and flags AI-sounding copy, while code counts characters and shows where LinkedIn cuts to "…see more". Paste a public LinkedIn post link to grade that post. Shift+Enter adds a line.
**Campaign results** works out click rate, cost per click, cost per lead, conversion and cost per 1,000 views from the numbers you type.
**Event promo plan** lays out announce (4 weeks before), reminder (2 weeks), one week to go, last call (the day before) and recap (2 days after), each with a Google Calendar button.
**A/B test** asks Jev which option wins and how strong each one is on its own.

### Send to

Every card has a **Send to** row. Events, reminders and leads get **Add to Google Calendar** (a prefilled link, no login). Every card can be sent to **Google Sheets** as a new row through a small Apps Script web app: see [docs/google-sheets.md](docs/google-sheets.md). Its URL is read on the server from `SHEETS_WEBHOOK_URL`.

Saved cards live in your browser (`localStorage`) until you delete them. Click one to edit it.

### Keyboard

| Key | Action |
| --- | --- |
| <kbd>Enter</kbd> | Save the card |
| <kbd>Esc</kbd> | Clear (or cancel an edit) |
| <kbd>Tab</kbd> | Keep a faint preview |
| <kbd>←</kbd> <kbd>→</kbd> | Choose between "Did you mean" chips |
| <kbd>/</kbd> | Open every card type |

URL flags: `?debug=1` shows every probability; `?demo=1&loop=1` plays a scripted demo.

## How it works

<p align="center"><img src="docs/diagrams/architecture.svg" alt="Keystroke, debounced hook, server route, Jev or offline classifier, decide, gate signals, parse, card" width="820"></p>

Raw model output flickers as you type, so a small state machine turns confidence into calm UI states. A card only changes when a challenger wins twice in a row (or is very sure), and signal badges use an on/off hysteresis band.

<p align="center"><img src="docs/diagrams/states.svg" alt="States: input, ghost preview, choose between two chips, committed card, with the thresholds between them" width="820"></p>

The diagrams are Excalidraw files — open any `docs/diagrams/*.excalidraw` at [excalidraw.com](https://excalidraw.com) to edit them.

| Path | What lives there |
| --- | --- |
| `src/components/intents/registry.ts` | **The extension point.** One entry per card type. |
| `src/lib/jev/questions.ts` | The Jev question schema |
| `src/lib/jev/mock.ts` | Offline keyword classifier (same output shape) |
| `src/lib/parse/` | One deterministic parser per card type |
| `src/lib/decide.ts`, `src/lib/signals.ts` | The calm-UI state machine |
| `src/components/shapeshift/` | Shell, chips, palette, saved list, HUD |

### Adding a card type

1. Add the key to `INTENT_KEYS` in `src/lib/jev/types.ts`.
2. Add a non-overlapping criterion to `intent` in `src/lib/jev/questions.ts`.
3. Write a parser in `src/lib/parse/` and register it in `src/lib/parse/index.ts`.
4. Write a card component in `src/components/intents/` and add a registry entry.
5. Teach the offline classifier in `src/lib/jev/mock.ts`, and add tests.

TypeScript will point at anything you missed.

## Development

```bash
bun run check    # typecheck + lint + tests
bun test         # parser, decision, signal and classifier tests
bun run build
```

Stack: Next.js (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui · Motion · chrono-node · zod · Vercel AI SDK.

## Credits and license

Based on [Shapeshift](https://github.com/anishfn/shapeshift) by [anishfn](https://github.com/anishfn). [MIT](LICENSE); the original copyright notice is kept in the LICENSE file.
