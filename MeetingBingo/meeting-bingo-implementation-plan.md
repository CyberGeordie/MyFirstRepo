# Meeting Bingo — Implementation Plan

**Version**: 1.0  
**Date**: May 21, 2026  
**Build Target**: 90-minute MVP  
**Stack**: React 18 + TypeScript + Vite + Tailwind + Web Speech API + Vercel  

---

## Review Summary

Reviewed: 2026-05-21 | Reviewers: VP Product, VP Engineering, VP Design

### Changes Applied

| # | Change |
|---|--------|
| 1 | Add `npm install -D @types/dom-speech-recognition` to Phase 1 setup commands to fix compile-time blocker |
| 2 | Add `version` field to persisted `GameState`; clear and reinitialize localStorage if version mismatches |
| 3 | Add `shouldRestart` ref in `useSpeechRecognition`; `onerror` sets it `false` before writing `isListening`; `onend` checks `shouldRestart` not `isListening` |
| 4 | Add reference link to `meeting-bingo-prd.md` in acceptance criteria section so contributors can verify requirements |
| 5 | Add dedicated microphone permission step/component (PermissionPrompt) to Phase 3 task list with privacy copy |
| 6 | Define clear boundary: `GameContext` owns global state; `useGame` is a local consumer hook — no duplicate state |
| 7 | Normalize word detection consistently: use `\bword\b` for single words; for phrases use normalized substring with word-boundary check at phrase edges to prevent false positives like "API" inside "RAPID" |
| 8 | Specify `aria-label`, `role="grid"`, `role="gridcell"`, and keyboard navigation (arrow keys) for the 5×5 bingo grid |
| 9 | Wrap `animate-pulse` and canvas-confetti calls behind `prefers-reduced-motion` media query check |
| 10 | Wire `getClosestToWin()` result to a UI hint in `GameBoard` — show "One away from BINGO!" banner when `needed === 1` |
| 11 | Add `<textarea>` select/copy fallback in `shareUtils.ts` for non-HTTPS or clipboard-denied contexts |
| 12 | Define responsive tap-target strategy: minimum `44px` square size on mobile via Tailwind `min-h-[44px] min-w-[44px]` |
| 13 | Specify immutable square state updates in `onResult` callback: `setState(prev => prev.map(...spread))` pattern |
| 14 | Add `npm install -D @types/canvas-confetti` to Phase 1 setup to prevent TypeScript import errors |
| 15 | Add 15-min buffer to Phase 1 for npm install, browser testing, and Vercel CLI setup — adjust timeline to 105 min |
| 16 | Make share URL dynamic: read from `window.location.origin` or `import.meta.env.VITE_APP_URL` instead of hardcoding |
| 17 | Add a testing note for pure functions: `bingoChecker`, `cardGenerator`, `wordDetector` should have unit tests via Vitest |
| 18 | Use a secondary visual indicator for `isAutoFilled` beyond `✨` — e.g., a distinct border style or pattern fill that persists after animation ends |
| 19 | Add error state UI to `TranscriptPanel`: show descriptive message for each `SpeechRecognitionState.error` value |
| 20 | Add responsive stacking for CategorySelect: single column on mobile (`flex-col sm:flex-row`) |
| 21 | Add "Resume or start fresh?" prompt on app load when localStorage contains an in-progress game |
| 22 | Document `checkForBingo` single-win behavior: add a code comment clarifying that simultaneous double-bingo returns only the first line found |
| 23 | Add `vercel.json` with CSP and cache-control headers for production deployment |
| 24 | Use a distinct visual treatment for win screen card (e.g., gold/amber highlight) separate from in-game green fill state |
| 25 | Add promotion criteria for "custom buzzword lists" post-MVP feature to prevent backlog drift |

### Unresolved Items

- [ ] Multiplayer support — deferred to post-MVP (Firebase Option C in architecture doc)
- [ ] Sound effects — out of scope per PRD

---

## Overview

Build a browser-based bingo game that auto-detects meeting buzzwords via live speech transcription. No backend. No cost. Ships to Vercel free tier.

Four phases track the original 90-minute workshop budget. Each phase produces working, testable software — stop after any phase and the app still runs.

---

## Phase 1 — Foundation (20 min)

### 1.1 Scaffold the Project

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

**Timeline note**: Allow 15 min buffer for npm install, browser testing, and Vercel CLI setup (total ~105 min).

### 1.2 Configure Tailwind

`tailwind.config.js` — set `content` to `["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]` and add `bounceIn` keyframe animation under `theme.extend`.

`src/index.css` — add the three Tailwind directives (`@tailwind base/components/utilities`).

### 1.3 Create File Structure

```
src/
├── types/index.ts
├── data/categories.ts
├── lib/cardGenerator.ts
├── lib/bingoChecker.ts
├── lib/wordDetector.ts
├── lib/shareUtils.ts
├── hooks/useSpeechRecognition.ts
├── hooks/useGame.ts
├── context/GameContext.tsx
├── components/
│   ├── LandingPage.tsx
│   ├── CategorySelect.tsx
│   ├── GameBoard.tsx
│   ├── BingoCard.tsx
│   ├── BingoSquare.tsx
│   ├── TranscriptPanel.tsx
│   ├── WinScreen.tsx
│   ├── GameControls.tsx
│   └── ui/Button.tsx, Card.tsx, Toast.tsx
├── App.tsx
└── main.tsx
```

### 1.4 Type Definitions (`src/types/index.ts`)

Define the full type surface up front — everything else references these:

| Type | Purpose |
|------|---------|
| `CategoryId` | `'agile' \| 'corporate' \| 'tech'` |
| `BingoSquare` | `id, word, isFilled, isAutoFilled, isFreeSpace, filledAt, row, col` |
| `BingoCard` | `squares: BingoSquare[][]` (5×5) + flat `words[]` for detection |
| `GameStatus` | `'idle' \| 'setup' \| 'playing' \| 'won'` |
| `WinningLine` | `type, index, squares[]` |
| `GameState` | Full game object: status, category, card, isListening, timestamps, winningLine |
| `SpeechRecognitionState` | `isSupported, isListening, transcript, interimTranscript, error` |
| `Toast` | `id, message, type, duration` |

### 1.5 Buzzword Data (`src/data/categories.ts`)

Three categories, 40+ words each:
- **Agile & Scrum** (`id: 'agile'`, icon `🏃`) — sprint, backlog, standup, velocity, blocker, story points, epic, user story, scrum master, kanban, burndown, refinement, iteration, acceptance criteria, definition of done, technical debt, CI/CD, MVP, etc.
- **Corporate Speak** (`id: 'corporate'`, icon `💼`) — synergy, leverage, circle back, bandwidth, low-hanging fruit, move the needle, deep dive, paradigm shift, value proposition, ROI, pivot, north star, etc.
- **Tech & Engineering** (`id: 'tech'`, icon `💻`) — API, microservices, serverless, kubernetes, docker, pipeline, observability, postmortem, SLA, feature flag, A/B test, etc.

**Checkpoint**: `npm run dev` loads a blank page with no errors.

---

## Phase 2 — Core Game (30 min)

### 2.1 Card Generator (`src/lib/cardGenerator.ts`)

`generateCard(categoryId)`:
1. Look up category words
2. Fisher-Yates shuffle the word list
3. Pick first 24 shuffled words
4. Build 5×5 `BingoSquare[][]` — center (2,2) is `isFreeSpace: true, isFilled: true`
5. Return `{ squares, words }` — flat `words` array enables O(n) detection later

`getCardWords(card)` — returns flat word list excluding free space.

### 2.2 Bingo Checker (`src/lib/bingoChecker.ts`)

`checkForBingo(card)` — checks all 12 lines in order, returns first `WinningLine` found or `null`:
- 5 rows
- 5 columns  
- Diagonal top-left → bottom-right
- Diagonal top-right → bottom-left

`countFilled(card)` — count for the progress counter.

`getClosestToWin(card)` — returns `{ needed, line }` for the "one away!" UX signal.

### 2.3 Landing Page (`src/components/LandingPage.tsx`)

Layout matches PRD §6.2:
- `🎯 MEETING BINGO` heading
- Tagline: "Turn any meeting into a game"
- Prominent `🎮 NEW GAME` button
- Privacy note: "🔒 Audio processed locally. Never recorded."
- How It Works: 4 numbered steps

### 2.4 Category Selection (`src/components/CategorySelect.tsx`)

3 cards in a row (PRD §6.3). Each card shows icon, name, description, and 3 sample words. Clicking a card calls `onSelect(categoryId)`. Back button returns to landing.

### 2.5 Bingo Card + Square

**`BingoCard.tsx`** — renders the 5×5 grid. Passes `isWinningSquare` derived from `winningLine.squares` set.

**`BingoSquare.tsx`** — single interactive square. States:
- Default: `bg-white border-gray-200`
- Filled: `bg-blue-500 text-white line-through`
- Auto-filled: add `animate-pulse` briefly
- Free space: `bg-amber-100` non-clickable
- Winning: `bg-green-500 ring-2 ring-green-300`

PRD requires visual distinction between auto-filled and manual — add a small `✨` indicator on `isAutoFilled` squares.

### 2.6 Manual Toggle

`onClick` on any non-free square calls `setGame` to toggle `isFilled`. PRD §US-3.1 requires unfilling to work (toggle both ways).

### 2.7 App Routing (`src/App.tsx`)

Four screens via `useState<Screen>`:

```
'landing' → 'category' → 'game' → 'win'
```

`handleCategorySelect` calls `generateCard`, sets game state, navigates to `'game'`.  
`handleWin` receives `(winningLine, winningWord)`, stamps `completedAt`, navigates to `'win'`.

**Checkpoint**: Full game playable by clicking squares manually. BINGO triggers win screen.

---

## Phase 3 — Speech Recognition (25 min)

### 3.1 Speech Hook (`src/hooks/useSpeechRecognition.ts`)

Wraps `window.SpeechRecognition || window.webkitSpeechRecognition`.

Config: `continuous: true`, `interimResults: true`, `lang: 'en-US'`.

Key behaviors:
- `onresult` — accumulates `transcript` (final) and `interimTranscript` (interim); fires `onResult` callback with each final chunk
- `onerror` — sets `error` state, sets `isListening: false`
- `onend` — auto-restarts if `isListening` is still `true` (handles browser cutting off after silence)
- `startListening(onResult?)` — resets transcript, sets listening, calls `.start()`
- `stopListening()` — sets not-listening, calls `.stop()`
- Add a `shouldRestart` ref; `onerror` sets `shouldRestart = false` before updating state; `onend` checks `shouldRestart` (not `isListening`) to prevent infinite restart loops on permission-denied errors

Return `{ isSupported, isListening, transcript, interimTranscript, error, startListening, stopListening, resetTranscript }`.

### 3.2 Word Detector (`src/lib/wordDetector.ts`)

`detectWords(transcript, cardWords, alreadyFilled)`:
- Normalize both sides to lowercase, normalize smart quotes
- Single words: `\bword\b` regex match
- Multi-word phrases: substring match
- Skip words already in `alreadyFilled` set

`detectWordsWithAliases(...)` — also checks `WORD_ALIASES` map (e.g. `'ci/cd'` matches `'cicd'`, `'continuous integration'`).

### 3.3 Wire Auto-Fill into Game

In `GameBoard.tsx`, call `useSpeechRecognition()`. Pass an `onResult` callback that:
1. Calls `detectWordsWithAliases(newTranscript, card.words, alreadyFilledSet)`
2. For each detected word, finds its square in the grid and sets `isFilled: true, isAutoFilled: true`
3. Calls `checkForBingo` — if win, calls `onWin(winningLine, detectedWord)`
4. Shows a Toast notification for each detected word (PRD §US-2.3)

Auto-fill animation: temporarily add `animate-pulse` class on `isAutoFilled` squares, remove after 1s.

### 3.4 Transcript Panel (`src/components/TranscriptPanel.tsx`)

Shows:
- Red pulsing dot when listening, grey when paused
- Last ~100 chars of transcript + italic interim text
- Detected words as green pill badges (last 5 only to avoid overflow)

PRD §US-2.2: visual feedback confirming transcription is active is critical for trust.

### 3.5 Game Controls (`src/components/GameControls.tsx`)

- **🎤 Start / Stop Listening** toggle — calls `startListening` / `stopListening`
- **🔄 New Card** — regenerates card for same category (resets game state, keeps listening)
- Browser compatibility note: show a fallback banner if `!isSupported` (Firefox) explaining manual-only mode

**Checkpoint**: App transcribes live audio and auto-fills squares. Manual tap still works as fallback.

---

## Phase 4 — Polish & Deploy (15 min)

### 4.1 Win Celebration

Install: `canvas-confetti` (already in `package.json`).

Trigger `confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })` on win.

UXR constraint: **no sound by default** — user is still in the meeting.

### 4.2 Win Screen (`src/components/WinScreen.tsx`)

Matches PRD §6.5 layout:
- `🎉 BINGO!` heading
- Winning card with highlighted row/col/diagonal in green
- Stats: ⏱️ time elapsed, 🏆 winning word, 📊 squares filled / 24
- `📤 SHARE RESULT` button
- `🔄 PLAY AGAIN` button → back to category select

### 4.3 Share Utils (`src/lib/shareUtils.ts`)

`generateShareText(game)` — builds Slack/Discord-friendly text:
```
🎯 I got BINGO playing Meeting Bingo!
📦 Category: Agile & Scrum
⏱️ Time: 22 minutes
🏆 Winning word: "Scope Creep"
📊 Squares filled: 12/24

Play at: meetingbingo.vercel.app
```

`shareResult(game)`:
1. Try `navigator.share()` (mobile native sheet)
2. Fall back to `navigator.clipboard.writeText()` + Toast "Copied!"
3. Fallback: if clipboard API is unavailable (HTTP context), create a `<textarea>`, select its content, and call `document.execCommand('copy')`.

PRD §US-4.3: must work in Slack, Teams, Discord paste.

### 4.4 localStorage Persistence

`useLocalStorage<T>(key, initialValue)` hook — reads on mount, writes on every game state change.

Persist `GameState` under key `meeting-bingo-game` so tab refresh restores the in-progress card.

Include a `version: 1` field in persisted state. On load, if stored `version` doesn't match current, clear the key and reinitialize.

### 4.5 Deploy to Vercel

```bash
npm run build          # tsc && vite build → dist/
npx vercel --prod      # deploys dist/ to meetingbingo.vercel.app
```

Vercel config: no `vercel.json` needed — static site auto-detected.

**Checkpoint**: Full end-to-end working. Share button tested in Slack/clipboard.

---

## Acceptance Criteria Checklist

Derived directly from PRD §3 and §9.

### Game Setup
- [ ] Landing page loads < 2s
- [ ] 3 categories displayed with sample words
- [ ] Card generates with 24 unique words + free center space
- [ ] No duplicate words on same card
- [ ] Can regenerate card before game starts

### Speech Recognition
- [ ] Microphone permission prompt explains local processing
- [ ] Listening indicator (red dot) visible when active
- [ ] Transcription begins within 1s of enabling
- [ ] Continuous listening (doesn't stop after silence)
- [ ] Buzzwords auto-fill within 500ms of detection
- [ ] Toast notification shows detected word
- [ ] Graceful fallback to manual-only if API unavailable

### Gameplay
- [ ] Manual tap toggles filled/unfilled
- [ ] Same word spoken twice only fills once
- [ ] Progress counter shows X/24
- [ ] "One away!" signal when 4 in a line
- [ ] BINGO detected for all 5 rows, 5 columns, 2 diagonals
- [ ] Winning line highlighted green on win

### Win & Share
- [ ] Confetti plays on BINGO (no sound)
- [ ] Win screen shows time, winning word, squares filled, category
- [ ] Share copies formatted text to clipboard
- [ ] Mobile share triggers native share sheet
- [ ] Play Again returns to category select

---

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Web Speech API unavailable (Firefox) | `isSupported` check; show banner; manual tap still works fully |
| Poor transcription accuracy | Manual tap fallback always available; `WORD_ALIASES` map for common variants |
| Auto-restart loop on `onend` | Wrap `.start()` in try/catch — throws if already running |
| Celebration visible to boss | Confetti stays inside app window; no sound by default |
| Workshop time overrun | Each phase is independently shippable; Phase 4 features are droppable |

---

## Post-MVP Backlog (Not in Scope)

| Feature | Notes |
|---------|-------|
| Custom buzzword lists | High UXR demand; low complexity |
| Multiplayer via Firebase | Architecture doc has Option C design ready |
| Dark mode | Tailwind dark: variant, 2-hour task |
| PWA / installable | Add `manifest.json` + service worker |
| Achievement system | Persistent localStorage stats |
