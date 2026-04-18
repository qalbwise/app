# Product Requirements Document
## Qalbwise
**Hackathon:** Quran Foundation Hackathon — Ramadan 2026
**Submission deadline:** End of Shawwal 1447 (April 20, 2026)
**Prize pool:** $10,000 across 7 winners
**Repository:** github.com/qalbwise/app
**Status:** Final v2.0
**Last updated:** April 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals and Success Metrics](#3-goals-and-success-metrics)
4. [Target Users](#4-target-users)
5. [Concept and Positioning](#5-concept-and-positioning)
6. [Competitive Landscape](#6-competitive-landscape)
7. [Features and Requirements](#7-features-and-requirements)
8. [User Flow and Onboarding](#8-user-flow-and-onboarding)
9. [Technical Architecture](#9-technical-architecture)
10. [Search System Design](#10-search-system-design)
11. [API and Integration Specifications](#11-api-and-integration-specifications)
12. [UI and Design Principles](#12-ui-and-design-principles)
13. [Judging Criteria Alignment](#13-judging-criteria-alignment)
14. [Out of Scope](#14-out-of-scope)
15. [Risks and Mitigations](#15-risks-and-mitigations)
16. [Open Questions](#16-open-questions)

---

## 1. Overview

**Qalbwise** — from *qalb* (قَلْب, Arabic for heart) and *wise* — lets users type anything on their mind and instantly discover what the Quran says about it, accurately, contextually, and personally.

The name is rooted in the Quran itself. In 50:37, Allah says: *"There truly is a reminder in this for whoever has a heart"* — the heart being the seat of understanding, feeling, and faith. Qalbwise is the bridge between what is on your heart and what the Quran says about it.

---

## 2. Problem Statement

### The core issue
Millions of Muslims reconnect with the Quran during Ramadan but struggle to maintain that connection afterwards. Most Quran apps assume the user already knows what they are looking for — a specific surah, an ayah number, or a known topic. They are excellent reference tools but poor discovery tools.

At the same time, many Muslims already informally ask AI assistants "what does the Quran say about X?" — but those responses are unverified, potentially inaccurate, and ungrounded in canonical text.

### The gap
No app currently combines:
- **Topic-first discovery** — the entry point is a life situation, not a verse reference
- **Canonically sourced results** — every verse comes from authoritative Quran Foundation data, not LLM memory
- **Personal reflection layer** — a way to save, annotate, and return to what resonated

### The opportunity
An app that answers "what does the Quran say about my situation right now?" with verified, contextual, and beautifully presented results — and builds a habit of returning.

---

## 3. Goals and Success Metrics

### Hackathon goals

| Goal                                         | Metric                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| Score highly on Impact (30 pts)              | App directly addresses the hackathon's stated problem of post-Ramadan drop-off |
| Score highly on Product Quality (20 pts)     | Clean onboarding, no login wall, smooth result experience                      |
| Score highly on Technical Execution (20 pts) | Stable demo, no crashes, correct API integration                               |
| Score highly on Innovation (15 pts)          | Topic-first discovery angle not present in existing apps                       |
| Score highly on API Use (15 pts)             | Meaningful use of both Content and User API categories                         |

### Product goals (beyond hackathon)
- Users experience at least one "I didn't know the Quran spoke to this" moment per session
- Users return on consecutive days, measured via streak tracking
- Users save at least one verse per session after account creation

---

## 4. Target Users

### Primary
- **Post-Ramadan Muslims** — people who felt connected to the Quran during Ramadan and want to maintain that but don't know how to start on a regular day
- **Non-Arabic speakers** — Muslims who struggle to engage with the Quran because they don't understand Arabic and need a meaning-first entry point

### Secondary
- **New Muslims** — recent converts with deep motivation but little knowledge of where to look in the Quran for guidance
- **Muslims in hardship** — people going through grief, loss, anxiety, or major life transitions who are looking for comfort

### Not the primary target (v1)
- Advanced Quran students seeking scholarly analysis
- Users focused on tajweed or memorisation (Hifz)
- Academic researchers

---

## 5. Concept and Positioning

### Name
**Qalbwise** — *qalb* (قَلْب) is Arabic for heart, the Quranic seat of understanding and faith. *Wise* grounds the name in English and signals guidance and discernment. Together: wisdom for the heart, or guided by the heart.

The name is rooted in the Quran's own description of itself in 50:37: *"There truly is a reminder in this for whoever has a heart, whoever listens attentively."*

### One-sentence positioning
> "Type anything on your mind — grief, ambition, fear, gratitude — and discover what the Quran says about it."

### Tagline
> *"Wisdom for what's on your heart."*

### Core concept
The Quran as a mirror for everyday life. The entry point is not a surah or an ayah — it is a feeling, a situation, or a question. Qalbwise does the translation work, mapping human language to Quranic vocabulary, so the user never needs prior knowledge to begin.

### Emotional hook
The moment of surprise and recognition when a user discovers the Quran speaks directly to their situation is the product's core value. This drives sharing and return visits.

---

## 6. Competitive Landscape

| App                  | Strengths                                                  | Gap                                                                          |
| -------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Quran.com**        | Gold standard for reading, translations, tafsir            | Reference-first, not discovery-first. No topic search.                       |
| **Muslim Pro**       | Broad Islamic utility, high installs                       | Shallow Quran engagement. No thematic discovery.                             |
| **Tarteel AI**       | AI-powered recitation recognition and tajweed              | Focused on recitation, different audience entirely.                          |
| **QuranReflect**     | Community reflection built on QF APIs                      | Verse-first not topic-first. Complement, not competitor.                     |
| **Ayah.app**         | Minimalist random verse display                            | No search, no personalisation, no depth.                                     |
| **ChatGPT / Claude** | Already used informally for "what does Quran say about X?" | Responses are unverified and ungrounded. **Direct replacement opportunity.** |

### Unique position
Qalbwise is the only app combining topic-first discovery + canonically sourced results + a personal reflection layer.

---

## 7. Features and Requirements

### 7.1 Core features (must have for submission)

#### Topic search
- Free-form text input accepting any language, any length
- Example prompt chips on the home screen (e.g. "grief", "anxiety", "gratitude", "new beginning", "fear of failure")
- No login required to search
- Each submission creates a persistent slug URL that survives refresh and navigation

#### Verse result cards
Each result card displays:
- Surah name and ayah reference (e.g. "Ad-Duha 93:5")
- Arabic text of the verse (Uthmani script)
- English translation (Abdel Haleem, default)
- A one-line LLM-generated "Why this verse" explanation connecting the result to the user's specific query
- Ranking communicated via opacity, not numbers
- Link to full verse on quran.com

#### Tafsir expansion
- Tapping a verse card expands it to show a tafsir excerpt
- Fetched via the QF MCP `search_tafsir` tool
- Clearly attributed to the tafsir source

#### Bookmarks (requires login)
- Users can save any verse to their personal collection
- Implemented via local Bookmarks API (stored in our database)
- Login prompted only when a user attempts to save — not before

#### Streak tracking
- Daily streak tracked and displayed via the QF Streak API
- Shown on the post-login home screen

### 7.2 Differentiating features (target at least two)

#### LLM "Why this verse" explanation
- One sentence generated per result explaining the specific connection to the user's query
- Uses OpenAI SDK (GPT-4o-mini) with a tightly scoped prompt grounded in retrieved content
- Framed as contextual relevance, never as religious ruling

#### Personal topic journal
- Every search is logged as a timestamped entry: topic + verses found + date
- Becomes a personal spiritual diary over time using our Notes API (stored locally)

#### Multi-language topic input
- The QF MCP `search_quran` tool handles Arabic, Urdu, Malay, English, and other languages natively
- Users type in their native language with no language selection step required

### 7.3 Nice-to-have features (if time allows)
- Audio recitation playback via QF Audio API
- Share verse as a formatted image
- Related verse suggestions
- Collections: themed folders for saved verses
- Daily personalised verse based on past search topics

---

## 8. User Flow and Onboarding

### Design principle
Value before friction. Users must experience the core value before being asked to create an account. The login gate appears only at the moment of demonstrated intent — when the user tries to save a verse.

### Screen-by-screen flow

#### Screen 1 — Home (no login required)
- Single open input field: "What's on your mind?"
- Subtitle: "Discover what the Quran says about anything in your life."
- 6 example chips (emotional and situational, not theological)
- No splash screen, no tutorial, no sign-up prompt
- Onboarding prompt option: *"What's on your qalb today?"*

#### Screen 2 — Loading state (no login required)
- On submit, frontend navigates immediately to `/search/:slug`
- Spinner with message: "Searching the Quran…"
- Progress messages streamed via SSE: "Searching the Quran…" → "Ranking the best matches…"
- Skeleton cards appear immediately to prevent layout jump
- The URL is permanent from this point — shareable and refresh-safe

#### Screen 3 — Results (no login required)
- 3–5 verse cards ranked by relevance
- Opacity decreases with rank to communicate confidence
- Each card: surah reference, Arabic text, translation, "Why this verse →" tap target
- Share button visible on each card (works without login)
- Total result count shown: "69 verses found"

#### Screen 4 — Verse expanded (no login required, login nudge appears)
- Tapping a card expands it in place
- Shows tafsir excerpt, attribution, full "Why this verse" explanation
- "Save verse" button appears
- Below the card: soft contextual nudge — "Create a free account to build your personal Quran journal"

#### Screen 5 — Login sheet (triggered by tapping "Save verse")
- Appears as a bottom sheet overlay, not a full-screen redirect
- Framing: "Save your verse" / "Sign in to keep a personal Quran journal — free forever"
- Options: Continue with Google, Continue with Apple, Sign up with email
- After login: sheet dismisses, verse saves automatically

#### Screen 6 — Post-login home
- Confirmation: "Verse saved"
- Journal section shows first entry: today's topic + verses found
- Streak widget: day 1 highlighted
- Bottom nav bar: Search | Journal | Streak
- No onboarding tutorial — user is already using the app

### Onboarding summary

| Stage        | Login required? | Rationale                                  |
| ------------ | --------------- | ------------------------------------------ |
| Home screen  | No              | Zero friction entry                        |
| Search       | No              | Core value must be free                    |
| View results | No              | Discovery is the product                   |
| Read tafsir  | No              | Deeper engagement, still free              |
| Save a verse | Yes             | Demonstrated intent — optimal login moment |
| View journal | Yes             | Personal data requires account             |
| View streak  | Yes             | Persistent tracking requires account       |

---

## 9. Technical Architecture

### High-level overview

Qalbwise is a full-stack web application with:
- A React frontend that handles UI and search interactions
- A FastAPI backend that processes search requests and stores user data
- A background worker that handles long-running search jobs
- PostgreSQL for data storage
- Redis for task queue and caching

### Data flow

```
User submits topic
       ↓
Backend creates search record + queues background job → returns slug
       ↓
Frontend navigates to /search/:slug
       ↓
Backend streams progress updates to frontend
       ↓
Background worker: queries QF API for verses → ranks results → stores in database
       ↓
Frontend receives final results and renders verse cards
```
qalbwise/
├── .moon/
│   ├── workspace.yml         # Project locations & Moon config
│   └── toolchains.yml        # Language & tool versions
├── apps/
│   ├── web/                  # React 19 frontend (TypeScript + Vite)
│   │   └── src/
│   │       ├── modules/      # Feature modules (components + hooks)
│   │       ├── routes/       # TanStack file-based routes
│   │       └── lib/api.ts    # Singleton typed API client
│   └── api/                  # FastAPI backend (Python)
│       └── app/
│           ├── api/          # Routes & Pydantic schemas
│           ├── modules/      # Business logic (services)
│           ├── models/       # SQLAlchemy models
│           └── core/         # Settings, logging, Celery
├── packages/
│   └── core/                 # Shared typed API client
│       └── src/
│           ├── api/          # Feature API methods
│           ├── client.ts     # createApi() factory
│           └── schema.d.ts   # Auto-generated from /openapi.json
└── docker-compose.yml
```

### Tech stack

#### Frontend (`apps/web`)
| Tool                  | Purpose                                   |
| --------------------- | ----------------------------------------- |
| React 19 + TypeScript | UI framework                              |
| Vite                  | Build tool                                |
| Tailwind CSS v4       | Styling                                   |
| shadcn/ui             | Component library                         |
| TanStack Router       | File-based routing + slug page navigation |
| TanStack Query        | Server state, polling fallback for SSE    |

#### Backend (`apps/api`)
| Tool                 | Purpose                                     |
| -------------------- | ------------------------------------------- |
| FastAPI              | API framework + SSE via `StreamingResponse` |
| SQLAlchemy + Alembic | ORM and database migrations                 |
| Celery               | Background task queue for search jobs       |
| Redis                | Celery broker and result backend            |
| Ruff                 | Linter and formatter                        |
| Loguru               | Logging                                     |
| Scalar               | API docs (at `/scalar`)                     |

#### Shared (`packages/core`)
| Tool               | Purpose                                                |
| ------------------ | ------------------------------------------------------ |
| openapi-typescript | Generates TypeScript types from FastAPI OpenAPI schema |
| openapi-fetch      | Fully typed API client                                 |

#### Monorepo tooling
| Tool       | Purpose                                                 |
| ---------- | ------------------------------------------------------- |
| Moon       | Task runner and monorepo orchestration                  |
| Proto      | Toolchain version management (Node.js, Python, pnpm)    |
| pnpm       | JavaScript package manager                              |
| uv         | Python package manager                                  |
| Biome      | JavaScript/TypeScript linter and formatter (root-level) |
| Lefthook   | Git hooks                                               |
| commitlint | Commit message linting (Conventional Commits)           |

### High-level data flow

```
User input (topic)
       ↓
POST /api/search → create Search record + enqueue Celery task → return slug
       ↓
Frontend navigates to /search/:slug
       ↓
GET /api/search/:slug/stream (SSE) → streams job status events
       ↓
Celery worker: QF MCP search → OpenAI ranking → write results to DB
       ↓
SSE emits "complete" → frontend renders verse cards
       ↓
[On save] Local Bookmarks/Notes/Streaks → Stored in our database
```

---

## 10. Search System Design

This section describes how the search feature works — from user input to results.

### Design principles

- **Job outlives the request.** Search runs in the background, independent of the user's browser connection.
- **Persistent URLs.** Every search gets a unique slug. Users can refresh, share, or bookmark the URL.
- **Real-time progress.** Users see updates as their search progresses.

### What happens when a user searches

1. **Submit** — User enters a topic and submits. Backend creates a search record and returns a slug.

2. **Navigate** — Frontend navigates to `/search/:slug`. Progress stream begins.

3. **Process** — Background worker queries the Quran API, ranks results, stores them in the database.

4. **Stream** — Backend streams progress updates to the frontend.

5. **Complete** — Results appear. The URL is now permanent and shareable.

### Edge cases

- **User refreshes mid-search** — The page reconnects and reads current status from the database. The search continues in the background.
- **User leaves and returns** — Coming back to the slug URL loads results directly from the database.
- **Not logged in** — Searches are tracked via session cookie. User can create an account later to claim their search history.

---

## 11. API Integrations

### Quran Foundation API

Qalbwise integrates with the Quran Foundation's content API to provide:
- **Verse search** — Query the Quran by topic in any language
- **Tafsir lookup** — Get scholarly explanations for any verse
- **Translations** — Multiple translations available (English, Arabic, etc.)

### User Data Storage

The app stores user-specific data in its own database:
- **Saved verses** — Personal bookmark collection
- **Journal notes** — Personal reflections on verses
- **Streak tracking** — Daily engagement tracking

## 12. UI and Design Principles

### Visual principles
- Calm, minimal aesthetic — a spiritual tool, not a productivity app
- Generous whitespace; no clutter on the search screen
- Arabic text displayed prominently and correctly (right-to-left, Uthmani script, 22px minimum)
- Verse cards use opacity gradient to communicate ranking without numbers

### Home screen empty state
The blank input is the biggest UX risk. Example chips must be emotional and situational ("anxiety", "grief") — not theological ("Surah Al-Baqarah"). At least 6 chips covering both positive and negative emotional states.

### Slug page loading state
The loading screen on `/search/:slug` must feel purposeful, not empty. Show:
- The user's topic echoed back: *"Searching the Quran for: grief"*
- Progressive status messages fed from SSE: "Searching the Quran…" → "Ranking the best matches…"
- Skeleton cards (3 of them) to set layout expectation
- A calm, non-urgent visual — this is a spiritual experience, not a search engine race

### Verse result card anatomy
1. Surah name + ayah reference + ranking dot (teal, faded teal, gray for ranks 1–3)
2. Arabic text block (tinted background, RTL, Uthmani script)
3. Translation (italicised, muted)
4. Action row: "Read tafsir" | "Share" | "Why this verse ↓"
5. Expanded state: "Why this verse" explanation + tafsir section + quran.com link
6. Saved state: teal border, filled bookmark icon, personal note field

### Login design
- Bottom sheet, not a full-page redirect
- Framing: "Save your verse" and "personal Quran journal — free forever"
- Social login (Google, Apple) shown first
- After login: sheet dismisses and verse saves automatically

### Arabic font recommendation
Use a QF-recommended Arabic font such as **Uthmanic Hafs** or **Amiri**. Test rendering on mobile Chrome and Safari before submission.

### Religious sensitivity in copy
- "Why this verse" explanations must never claim to be religious rulings
- Framing: "this verse relates to your topic because..." not "Islam says about X..."
- Tafsir excerpts are clearly attributed to their scholarly source
- All Quran text comes from QF canonical sources — never LLM memory

---

## 13. Judging Criteria Alignment

### Impact on Quran engagement (30 pts) — estimated: 27/30
Qalbwise directly targets the hackathon's stated problem: the drop-off in Quran engagement after Ramadan. By meeting users in moments of personal need, it creates a reason to return that requires no prior Quranic knowledge. Streak and journal features build the habit over time.

### Product quality and UX (20 pts) — estimated: 16/20
No login wall before search, persistent slug URLs that survive refresh and navigation, clean loading states with SSE progress, verse cards with clear hierarchy, smooth bottom-sheet login, post-login home with no onboarding tutorial.

### Technical execution (20 pts) — estimated: 17/20
Stable infrastructure, persistent URLs, real-time progress streaming, resilient background processing. Well-architected search system designed for reliability.

### Innovation and creativity (15 pts) — estimated: 13/15
Topic-first discovery angle, "Why this verse" LLM explanation, multi-language topic entry, and the name *Qalbwise* rooted in Quranic vocabulary (50:37).

### Effective use of APIs (15 pts) — estimated: 13/15
QF MCP (`search_quran`, `search_tafsir`) satisfies the Content API requirement. Local Bookmarks, Notes, and Streaks APIs satisfy the User API requirement. API usage is central to the product, not bolted on.

**Estimated total: 86/100**

---

## 14. Out of Scope

The following are not part of the v1 hackathon submission:

- Quran recitation or audio playback
- Hifz (memorisation) features
- Community features (Rooms, Posts, shared collections)
- Native mobile app (iOS/Android) — web only
- Tajweed or Arabic language learning tools
- Full tafsir browser
- Prayer times or other Islamic utility features
- Offline mode
- Admin dashboard or analytics
- Celery task retry logic and dead-letter queue (post-hackathon hardening)

---

## 15. Risks and Mitigations

| Risk                                              | Likelihood | Impact | Mitigation                                               |
| ------------------------------------------------ | ---------- | ------ | --------------------------------------------------------- |
| Topics don't map to Quranic vocabulary           | Medium     | Medium | Suggest rephrasing or related themes                      |
| External API downtime on demo day                | Low        | High   | Test before deadline; cache fallback results             |
| AI explanations sound like religious rulings     | Medium     | High   | Constrain system prompt; review outputs manually         |
| Connection drops on mobile network               | Medium     | Low    | Automatic retry                                         |
| Background worker unavailable                   | Low        | High   | Include worker in demo startup; monitor health            |
| Arabic text renders incorrectly on mobile         | Medium     | Medium | Test on mobile Chrome and Safari                        |

---

*Qalbwise — wisdom for what's on your heart. Built for the Quran Foundation Hackathon, Ramadan 2026.*