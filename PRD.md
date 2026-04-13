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
- Implemented via the QF Bookmarks API
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
- Becomes a personal spiritual diary over time using the QF Notes API

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

### Monorepo structure

Qalbwise is a full-stack monorepo managed with [Moon](https://moonrepo.dev) and [Proto](https://moonrepo.dev/proto). The repository lives at `github.com/qalbwise/app`.

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
├── docker-compose.yml
└── docker-compose.prod.yml
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
[On save] QF User APIs → Bookmarks, Notes, Streaks
```

---

## 10. Search System Design

This section describes the complete system design for the core search feature — the flow from a user submitting a topic to results appearing on screen, including resilience to page refresh, navigation, and anonymous usage.

### Design principles

- **Job outlives the request.** The search job runs in a Celery worker process, completely independent of the HTTP connection. If the browser closes, the work continues.
- **Slug = permanent address.** Every search creates a unique, persistent URL. The user can refresh, share, or return to it at any time.
- **SSE over WebSocket.** The progress stream is strictly one-directional (server → client). Server-Sent Events are simpler, work natively over HTTP/2, and require no special client library. WebSocket is reserved for bidirectional communication, which this feature does not need.
- **TanStack Query as fallback.** SSE connections can drop on mobile network switches or proxy timeouts. TanStack Query polling on the status endpoint provides resilience without additional infrastructure.

### Database model

```python
class Search(Base):
    __tablename__ = "searches"

    id: uuid                    # Internal primary key
    slug: str                   # Public URL identifier e.g. "srch_8f3k2m"
    topic: str                  # Original user input
    status: str                 # pending | processing | complete | failed
    step: str | None            # Current step label for UX ("searching_quran" | "ranking")
    raw_results: JSON | None    # Raw QF MCP response
    results: JSON | None        # Final ranked + explained results
    user_id: uuid | None        # Null for anonymous searches
    session_id: str             # Session cookie for anonymous tracking
    created_at: datetime
    updated_at: datetime
```

### Step-by-step flow

#### Step 1 — Submit (Frontend → FastAPI)

The user types a topic and submits. The frontend fires a single `POST /api/search`. This is the only user interaction required — everything else is automatic.

```typescript
// apps/web/src/modules/search/hooks/useCreateSearch.ts
const mutation = useMutation({
  mutationFn: (topic: string) => api.search.create({ topic }),
  onSuccess: ({ slug }) => {
    navigate({ to: "/search/$slug", params: { slug } });
  },
});
```

#### Step 2 — Create record + enqueue task (FastAPI)

The API does three things synchronously in under 50ms, then returns. The heavy work has not started yet.

```python
# apps/api/app/api/search/routes.py
@router.post("/search", status_code=201)
async def create_search(body: SearchCreate, db: Session, request: Request):
    search = Search(
        slug=generate_slug(),       # e.g. "srch_8f3k2m"
        topic=body.topic,
        status="pending",
        session_id=request.cookies.get("session_id"),
        user_id=current_user.id if current_user else None,
    )
    db.add(search)
    db.commit()

    run_search.delay(search.id)     # Enqueue Celery task

    return { "slug": search.slug }
```

#### Step 3 — Navigate to slug page (Frontend)

TanStack Router navigates immediately to `/search/srch_8f3k2m`. The slug page opens an SSE connection. From this point, the URL is permanent, shareable, and refresh-safe.

```typescript
// apps/web/src/routes/search/$slug.tsx
export const Route = createFileRoute("/search/$slug")({
  component: SearchPage,
});

function SearchPage() {
  const { slug } = Route.useParams();

  // Primary: SSE stream
  useEffect(() => {
    const es = new EventSource(`/api/search/${slug}/stream`);
    es.onmessage = (e) => {
      const event = JSON.parse(e.data);
      setSearchState(event);
      if (event.status === "complete" || event.status === "failed") {
        es.close();
      }
    };
    return () => es.close();
  }, [slug]);

  // Fallback: TanStack Query polling (if SSE drops)
  const { data } = useQuery({
    queryKey: ["search", slug],
    queryFn: () => api.search.get(slug),
    refetchInterval: (q) =>
      q.state.data?.status === "complete" ? false : 2000,
  });
}
```

#### Step 4 — Run job (Celery worker)

The Celery worker picks up the task from the Redis queue independently of any HTTP connection. It updates the Search record at each stage so that the status endpoint always reflects current progress.

```python
# apps/api/app/modules/search/tasks.py
@celery.task
def run_search(search_id: str):
    with db_session() as db:
        search = db.get(Search, search_id)

        # Stage 1: QF MCP
        search.status = "processing"
        search.step = "searching_quran"
        db.commit()

        raw = call_mcp("search_quran", {
            "query": search.topic,
            "translations": "auto",
        })
        search.raw_results = raw
        search.step = "ranking"
        db.commit()

        # Stage 2: OpenAI API
        ranked = call_claude_rank(search.topic, raw)

        search.results = ranked
        search.status = "complete"
        search.step = None
        db.commit()
```

#### Step 5 — Stream progress (FastAPI SSE)

A lightweight endpoint polls the database and streams status events to the connected client using FastAPI's `StreamingResponse`. No WebSocket handshake, no additional infrastructure.

```python
# apps/api/app/api/search/routes.py
@router.get("/search/{slug}/stream")
async def stream_search(slug: str, db: Session):
    async def event_generator():
        while True:
            search = db.query(Search).filter_by(slug=slug).first()

            yield f"data: {search.to_stream_json()}\n\n"

            if search.status in ("complete", "failed"):
                break

            await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering
        },
    )
```

Events emitted over the stream:

```
data: {"status": "pending"}
data: {"status": "processing", "step": "searching_quran"}
data: {"status": "processing", "step": "ranking"}
data: {"status": "complete", "results": [...]}
```

### Edge case handling

#### User refreshes mid-load
The slug page mounts, opens a new SSE connection to the same slug, and reads the current status from the database. The Celery task was never interrupted. The UI resumes from wherever the worker currently is — no re-processing, no data loss.

#### User navigates back to home
The SSE connection closes when the component unmounts. The Celery worker continues to completion regardless. The Search record is saved with full results. When the user returns to `/search/srch_8f3k2m` (via history or a direct link), the status is already `complete` and results render instantly from the database — the SSE stream closes immediately after emitting the first `complete` event.

#### SSE connection drops (mobile network, proxy timeout)
TanStack Query's `refetchInterval` polls `GET /api/search/:slug` every 2 seconds while the status is not `complete`. When polling detects `complete`, it updates the query cache and the UI renders results. The user experiences a seamless transition with at most 2 seconds of additional latency compared to the SSE path.

#### Anonymous user (not logged in)
Searches are associated with a session cookie (`session_id`), not a user account. The search history page queries by `session_id` for anonymous users. If the user later creates an account or logs in, their session's searches can be migrated to their user record. This preserves the "no login required to search" principle.

#### Search history
Every `Search` record is persisted in PostgreSQL. The history view is a standard `GET /api/searches` endpoint ordered by `created_at` — no additional infrastructure. Each history entry links back to its permanent slug URL.

### Why Celery + Redis (not async FastAPI alone)

FastAPI's `async` / `await` runs inside a single event loop. A long-running search job (MCP call + OpenAI call, potentially 3–8 seconds) would block that event loop if run synchronously, degrading all other requests. Using `asyncio.create_task` keeps it non-blocking but ties the job to the request lifecycle — if the connection closes, the task is cancelled.

Celery moves the job entirely outside FastAPI into a separate worker process. The worker runs independently, has its own database connections, can be scaled horizontally, and is completely unaffected by what the browser does. Redis serves as the task broker (queue) and optionally as the result backend.

### Why SSE (not WebSocket)

|                     | SSE                          | WebSocket                       |
| ------------------- | ---------------------------- | ------------------------------- |
| Direction           | Server → Client only         | Bidirectional                   |
| Protocol            | HTTP/1.1 or HTTP/2           | Separate WS protocol            |
| FastAPI support     | Native (`StreamingResponse`) | Requires `websockets` library   |
| Proxy/Nginx support | Excellent                    | Requires explicit configuration |
| Auto-reconnect      | Built into `EventSource`     | Must implement manually         |
| Use case fit        | Progress stream              | Chat, collaborative editing     |

The search progress stream is strictly one-directional. SSE is the right tool. WebSocket adds protocol complexity with no benefit for this use case.

---

## 11. API and Integration Specifications

### 11.1 Internal API endpoints (FastAPI)

| Method | Endpoint                   | Auth     | Description                              |
| ------ | -------------------------- | -------- | ---------------------------------------- |
| `POST` | `/api/search`              | Optional | Create search, returns slug              |
| `GET`  | `/api/search/:slug`        | Optional | Get search status and results            |
| `GET`  | `/api/search/:slug/stream` | Optional | SSE stream of job progress               |
| `GET`  | `/api/searches`            | Optional | List search history (by session or user) |
| `POST` | `/api/bookmarks`           | Required | Save a verse                             |
| `GET`  | `/api/bookmarks`           | Required | List saved verses                        |
| `GET`  | `/api/streak`              | Required | Get current streak                       |
| `POST` | `/api/activity`            | Required | Log a daily activity                     |

### 11.2 QF MCP — content retrieval (no auth required)

**Endpoint:** `POST https://mcp.quran.ai/mcp`

**Tool: `search_quran`**

| Parameter      | Type               | Description                                                  |
| -------------- | ------------------ | ------------------------------------------------------------ |
| `query`        | string             | User's raw topic input — any language                        |
| `translations` | string             | `"auto"` to auto-detect language and return best translation |
| `surah`        | integer (optional) | Restrict search to a specific surah number                   |

**Response fields used:**
- `results[].ayah_key` — verse reference (e.g. `"93:5"`)
- `results[].text` — Arabic text
- `results[].translations[0].text` — translated text
- `results[].translations[0].edition.author` — translator name
- `results[].relevance_score` — float 0–1
- `results[].url` — link to quran.com

**Tool: `search_tafsir`**

| Parameter           | Type    | Description                   |
| ------------------- | ------- | ----------------------------- |
| `query`             | string  | Topic or verse reference      |
| `include_ayah_text` | boolean | `true` to include Arabic text |

**MCP HTTP call (JSON-RPC 2.0):**
```bash
curl --request POST \
  --url https://mcp.quran.ai/mcp \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json, text/event-stream' \
  --data '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_quran",
      "arguments": {
        "query": "grief",
        "translations": "auto"
      }
    }
  }'
```

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
Full-stack monorepo with production-grade toolchain. Celery + Redis for resilient background job processing. SSE for real-time progress streaming. Type-safe frontend-to-backend API via auto-generated OpenAPI types. Docker Compose deployment. The search architecture — slug-based persistence, SSE streaming, TanStack Query polling fallback — is robust and well-considered.

### Innovation and creativity (15 pts) — estimated: 13/15
Topic-first discovery angle, "Why this verse" LLM explanation, multi-language topic entry, and the name *Qalbwise* rooted in Quranic vocabulary (50:37).

### Effective use of APIs (15 pts) — estimated: 13/15
QF MCP (`search_quran`, `search_tafsir`) satisfies the Content API requirement. QF User APIs (Bookmarks, Notes, Streak, Activity Days) satisfy the User API requirement. API usage is central to the product, not bolted on.

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

| Risk                                                                | Likelihood | Impact | Mitigation                                                                           |
| ------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------ |
| Edge-case topics don't map well to Quranic vocabulary               | Medium     | Medium | Graceful fallback: broader related theme suggestions + "try rephrasing as a feeling" |
| QF MCP rate limits or downtime on demo day                          | Low        | High   | Test before deadline; cache a small set of example results as static fallback        |
| LLM explanations sound like religious rulings                       | Medium     | High   | Tightly constrain system prompt; review outputs manually before submission           |
| SSE connection dropped by proxy or mobile network                   | Medium     | Low    | TanStack Query polling fallback — at most 2 seconds additional latency               |
| Celery worker unavailable in demo environment                       | Low        | High   | Ensure `moon run api:worker` is in demo startup script; add health check endpoint    |
| Arabic text rendering issues on mobile browsers                     | Medium     | Medium | Use Uthmanic Hafs or Amiri font; test on mobile Chrome and Safari                    |
| Type mismatch between FastAPI schema and generated TypeScript types | Low        | Medium | Run `moon run core:generate` after every Pydantic schema change; enforce in CI       |
| Nginx buffering SSE events (common misconfiguration)                | Medium     | High   | Set `X-Accel-Buffering: no` header on SSE endpoint; verify in staging                |

---

*Qalbwise — wisdom for what's on your heart. Built for the Quran Foundation Hackathon, Ramadan 2026.*

*This PRD reflects the final state of the project as of April 2026. v2.0 adds the complete search system design (Section 10), updated slug-based user flow, SSE architecture, Celery/Redis justification, and expanded risk and open questions sections.*