# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This repo contains planning documents for **Meeting Bingo** — a browser-based bingo game that auto-detects corporate buzzwords via the Web Speech API. No application code exists yet; implementation follows the docs in `MeetingBingo/`.

## Commands

Once the app is scaffolded under `meeting-bingo/`:

```bash
npm run dev        # Vite dev server on port 3000
npm run build      # tsc && vite build
npm run preview    # Preview production build
npm run lint       # ESLint (ts,tsx)
npm run typecheck  # tsc --noEmit
```

Tests use **Vitest** (to be added). Pure-logic modules that need unit tests: `bingoChecker`, `cardGenerator`, `wordDetector`.

## Bootstrap

```bash
npm create vite@latest meeting-bingo -- --template react-ts
cd meeting-bingo
npm install
npm install canvas-confetti
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/dom-speech-recognition
npm install -D @types/canvas-confetti
npx tailwindcss init -p
```

## Architecture

**Stack**: React 18 + TypeScript + Vite + Tailwind CSS + Web Speech API. No backend, no auth, no database — everything runs client-side and persists to `localStorage`.

**Screen routing** is handled via `useState<Screen>` in `App.tsx` (not react-router). Screens: `landing → category → game → win`.

**State ownership**: `GameContext` owns global game state; `useGame` is a consumer hook. No duplicate state between context and hooks.

**Key layers**:
- `src/lib/` — pure functions: `cardGenerator.ts`, `bingoChecker.ts`, `wordDetector.ts`, `shareUtils.ts`
- `src/hooks/` — `useSpeechRecognition`, `useGame`, `useBingoDetection`, `useLocalStorage`
- `src/data/categories.ts` — buzzword lists for three category packs (Agile, Corporate, Tech)
- `src/types/index.ts` — all shared TypeScript interfaces

**Speech recognition** wraps `window.SpeechRecognition || window.webkitSpeechRecognition`. Uses a `shouldRestart` ref (not `isListening` state) in the `onend` handler to avoid stale-closure restart bugs. `onerror` sets `shouldRestart = false` before updating state.

**Word detection**: single words use `\bword\b` regex; multi-word phrases use normalized substring with word-boundary checks at phrase edges (prevents false positives like "API" matching inside "RAPID").

**localStorage**: `GameState` includes a `version` field; mismatch clears and reinitializes the stored state.

**`checkForBingo`** returns the first winning line found — simultaneous double-bingo is intentionally not handled.

## Planning Documents

| File | Contents |
|------|----------|
| `MeetingBingo/meeting-bingo-prd.md` | Acceptance criteria, data models, full buzzword lists, UI wireframes |
| `MeetingBingo/meeting-bingo-architecture.md` | Full component tree, type definitions, and reference implementations for all core modules |
| `MeetingBingo/meeting-bingo-implementation-plan.md` | Phased build plan with 25 reviewed changes applied (includes accessibility, reduced-motion, CSP headers, share fallback) |
| `MeetingBingo/meeting-bingo-uxr.md` | UX research |

## Custom Skills

`/plan-review-skill` — multi-perspective review (VP Product, VP Engineering, VP Design) for implementation plans and architecture proposals.
