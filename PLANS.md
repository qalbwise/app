# Qalbwise Implementation Plans

## MVP Development Phases

### Phase 1: Foundation & Authentication

**Description:** Setup the core infrastructure including database connection, authentication system with JWT tokens, and user management.

**Goals:**

- [x] **BE**: Setup PostgreSQL database connection
- [x] **BE**: Create User SQLAlchemy model
- [x] **BE**: Create Profile SQLAlchemy model
- [x] **BE**: Setup Alembic migration
- [x] **BE**: Implement password hashing (bcrypt)
- [x] **BE**: Create auth serializer (Pydantic schemas)
- [x] **BE**: Create auth router (FastAPI routes)
- [x] **BE**: Implement auth service (login, register, logout)
- [x] **BE**: JWT access token generation
- [x] **BE**: JWT refresh token generation
- [x] **BE**: Token refresh endpoint
- [x] **BE**: Protected route dependency (get_current_user)

---

### Phase 2: Search Feature (Core)

**Description:** Implement the core topic-first search feature with slug-based URLs, SSE progress streaming, and Celery background processing.

**Goals:**

- [x] **BE**: Create Search SQLAlchemy model (slug, topic, status, step, raw_results, results, session_id, user_id)
- [x] **BE**: Setup Alembic migration for Search model
- [x] **BE**: Create search serializer (Pydantic schemas)
- [x] **BE**: Create search router (FastAPI routes)
- [x] **BE**: Implement search service (create, get, streaming)
- [x] **BE**: Implement search Celery task (QF MCP + OpenAI ranking)
- [x] **BE**: Add QF MCP client for content retrieval
- [x] **BE**: Add OpenAI SDK client for semantic ranking
- [x] **BE**: Create GET /api/searches endpoint (history)
- [x] **BE**: Integrate search router in main.py
- [x] **BE**: Import Search model in alembic/env.py

**API Endpoints:**

| Method | Endpoint                   | Description                   |
| ------ | -------------------------- | ----------------------------- |
| `POST` | `/api/search`              | Create search, returns slug   |
| `GET`  | `/api/search/:slug`        | Get search status and results |
| `GET`  | `/api/search/:slug/stream` | SSE stream of job progress    |
| `GET`  | `/api/searches`            | List search history           |

---

### Phase 3: Results & UI

**Description:** Build the frontend search results page with verse cards, tafsir expansion, and SSE integration.

**Goals:**

- [x] **FE**: Create search route page (`/search/:slug`)
- [x] **FE**: Implement SSE hook for real-time progress
- [x] **FE**: Create verse card component
- [x] **FE**: Implement "Why this verse" expansion
- [x] **FE**: Add tafsir fetch and display
- [x] **FE**: Add TanStack Query polling fallback
- [x] **FE**: Create topic chips on home page

---

### Phase 4: Bookmarks & User Features

**Description:** Implement local bookmarks, notes, and streak tracking (replaced QF User APIs with local implementation).

**Goals:**

- [x] **BE**: Create bookmark serializer and router
- [x] **BE**: Implement local Bookmarks API (stored in our DB)
- [x] **BE**: Create notes/journal endpoints
- [x] **BE**: Implement streak tracking endpoints (local, not QF)
- [x] **FE**: Add login sheet UI component
- [x] **FE**: Create post-login home with streak widget

---

### Phase 5: Polish & Submission

**Description:** Final polish, testing, and hackathon submission preparation.

**Goals:**

- [x] Add share functionality
- [x] Create collections feature (nice-to-have)
- [x] Test SSE on mobile networks
- [x] Add fallback static results for demo
- [x] Verify Arabic text rendering
- [x] Run full integration tests
- [x] Prepare demo startup script

## Post-MVP Improvements

### Phase 6: Authentication & Security Enhancements

**Description:** Replace JWT email/password auth with Google OAuth, add rate limiting to all API endpoints, and implement forbidden words filtering on search input.

**Goals:**

- [x] **BE**: Add Google OAuth token verification using `google-auth` library
- [x] **BE**: Update auth serializers (remove RegisterRequest, add GoogleLoginRequest)
- [x] **BE**: Update auth service (remove register(), update login() for Google)
- [x] **BE**: Remove `/auth/register` endpoint, update `/auth/login` for `id_token`
- [x] **BE**: Add GOOGLE_CLIENT_ID to settings.py
- [x] **BE**: Add FORBIDDEN_SEARCH_WORDS hardcoded list to settings.py (fuck, nigga, bastard, dick, etc.)
- [x] **BE**: Implement offensive content filter with leet speak detection (d1ck, n1gga, b4stard, etc.)
- [x] **BE**: Validate search input, return 400 if offensive keyword detected
- [x] **BE**: Return error message: "Search contains inappropriate language. Please try another topic."
- [x] **BE**: Create rate limiting middleware/dependency using `slowapi`
- [x] **FE**: Add client-side validation to prevent search submission with offensive keywords
- [x] **FE**: Show toast error before API call if offensive word detected
- [x] **FE**: Replace email/password login form with Google Sign-In button
- [x] **FE**: Update useLogin() hook to accept id_token instead of email/password
- [x] **FE**: Update header navigation to show Google Sign-In button
- [x] **Shared**: Update auth API module (login method signature)
- [ ] **Shared**: Run `moon run core:generate` to regenerate schema

**Rate Limiting Rules (per user/session):**

| Endpoint                       | Limit        | Window     |
| ------------------------------ | ------------ | ---------- |
| `/auth/login`, `/auth/refresh` | 5 attempts   | 15 minutes |
| `/api/search`                  | 20 searches  | 1 hour     |
| All other API endpoints        | 100 requests | 1 minute   |

**Implementation Notes:**
- Use `slowapi` library for rate limiting (Redis-based, FastAPI-compatible)
- Rate limiting scoped to user ID (authenticated) or session ID (anonymous)
- Return `429 Too Many Requests` with `Retry-After` header
- Frontend displays toast using sonner: `toast.error("Rate limit exceeded. Try again in X minutes")`
- Sonner is already configured in [apps/web/src/components/ui/sonner.tsx](apps/web/src/components/ui/sonner.tsx)

**Offensive Content Filter Implementation:**

**Backend (apps/api/app/core/settings.py):**
```python
FORBIDDEN_SEARCH_WORDS = {
    "fuck", "fucked", "fucking", "f*ck", "f**k", "fck",
    "nigga", "nigger", "n1gga", "n1gg4", "ngga",
    "bastard", "b4stard", "bastrd",
    "dick", "d1ck", "d!ck", "dck",
    "bitch", "b1tch", "b!tch",
    "asshole", "a$$hole", "@sshole",
    "shit", "sh1t", "sh!t",
    # Add more as needed
}

def is_leet_speak_variant(word: str, forbidden_word: str) -> bool:
    """Check if word is a leet speak variant of forbidden word"""
    normalized = word.lower().replace("1", "i").replace("3", "e").replace("@", "a").replace("$", "s").replace("!", "i").replace("0", "o").replace("4", "a").replace("5", "s").replace("7", "t")
    return normalized == forbidden_word.lower()
```

**Backend (apps/api/app/modules/search/service.py):**
```python
from apps.api.app.core.settings import FORBIDDEN_SEARCH_WORDS, is_leet_speak_variant
from fastapi import HTTPException

async def validate_search_input(topic: str) -> None:
    """Validate search input for offensive content"""
    topic_lower = topic.lower().strip()
    words = topic_lower.split()
    
    for word in words:
        # Check exact match
        if word in FORBIDDEN_SEARCH_WORDS:
            raise HTTPException(
                status_code=400,
                detail="Search contains inappropriate language. Please try another topic."
            )
        
        # Check leet speak variants
        for forbidden_word in FORBIDDEN_SEARCH_WORDS:
            if is_leet_speak_variant(word, forbidden_word):
                raise HTTPException(
                    status_code=400,
                    detail="Search contains inappropriate language. Please try another topic."
                )
```

**Call validation in create_search():**
```python
async def create_search(user_id: UUID | None, topic: str, session_id: str) -> Search:
    # Validate input first
    await validate_search_input(topic)
    
    # ... rest of search creation logic
```

**Frontend (apps/web/src/lib/forbidden-words.ts):**
```typescript
// Client-side offensive words list (mirror of backend)
export const FORBIDDEN_WORDS = new Set([
  "fuck", "fucked", "fucking", "f*ck", "f**k",
  "nigga", "nigger", "n1gga", "n1gg4",
  "bastard", "b4stard",
  "dick", "d1ck", "d!ck",
  "bitch", "b1tch",
  "asshole", "a$$hole",
  "shit", "sh1t",
]);

export function isLeetSpeakVariant(word: string, forbiddenWord: string): boolean {
  const normalized = word
    .toLowerCase()
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/!/g, "i")
    .replace(/0/g, "o")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t");
  return normalized === forbiddenWord.toLowerCase();
}

export function containsOffensiveContent(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/);
  
  for (const word of words) {
    // Exact match
    if (FORBIDDEN_WORDS.has(word)) return true;
    
    // Leet speak variants
    for (const forbidden of FORBIDDEN_WORDS) {
      if (isLeetSpeakVariant(word, forbidden)) return true;
    }
  }
  
  return false;
}
```

**Frontend (apps/web/src/modules/search/components/search-input.tsx):**
```typescript
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCreateSearch } from "@/modules/search/queries/use-search";
import { containsOffensiveContent } from "@/lib/forbidden-words";

const TOPIC_CHIPS = [
  "grief",
  "anxiety",
  "gratitude",
  "new beginning",
  "fear of failure",
  "patience",
] as const;

export const SearchInput = () => {
  const [topic, setTopic] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const navigate = useNavigate();
  const createSearch = useCreateSearch();

  async function handleSearch(searchTopic: string) {
    const trimmed = searchTopic.trim();
    if (!trimmed) return;

    setSearchError(null);

    // Client-side validation: check for offensive content
    if (containsOffensiveContent(trimmed)) {
      toast.error("Search contains inappropriate language. Please try another topic.");
      return;
    }

    try {
      const result = await createSearch.mutateAsync(trimmed);
      const slug = (result as { data?: { slug?: string } }).data?.slug;
      if (slug) {
        navigate({ to: "/search/$slug", params: { slug } });
      } else {
        toast.error("Could not start search. Please try again.");
      }
    } catch (error) {
      // Handle 400 Bad Request (offensive content from backend)
      if ((error as any).response?.status === 400) {
        toast.error((error as any).response?.data?.detail || "Invalid search term.");
      }
      // Handle 429 Too Many Requests (rate limit)
      else if ((error as any).response?.status === 429) {
        const retryAfter = (error as any).response?.headers?.["retry-after"];
        toast.error(`Rate limit exceeded. Try again in ${retryAfter || "a few"} minutes.`);
      }
      // Handle other errors
      else {
        toast.error("Search failed. Please check your connection and try again.");
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSearch(topic);
  }

  const isLoading = createSearch.isPending;
  const hasOffensiveContent = containsOffensiveContent(topic);

  return (
    <div className="mx-auto max-w-2xl text-center">
      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Type anything on your mind…"
            disabled={isLoading}
            className="w-full rounded-full py-4 pl-6 pr-36 text-[15px] outline-none transition-all placeholder:text-[#b0ada8]"
            style={{
              border: "1px solid rgba(0,0,0,0.1)",
              boxShadow: "var(--shadow-outline)",
              background: "#ffffff",
              color: "#000",
              letterSpacing: "0.15px",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow =
                "rgba(0,0,0,0.1) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-outline)";
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !topic.trim() || hasOffensiveContent}
            className="pill-btn-black absolute right-2 top-1/2 -translate-y-1/2 text-[14px]"
            style={{ height: "34px", padding: "0 18px" }}
            title={hasOffensiveContent ? "Inappropriate language detected" : ""}
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-3.5 w-3.5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeOpacity="0.3"
                  />
                  <path
                    d="M12 2a10 10 0 0 1 10 10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                Searching…
              </span>
            ) : (
              "Search"
            )}
          </button>
        </div>
      </form>

      {/* Topic chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {TOPIC_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => {
              handleSearch(chip);
            }}
            disabled={isLoading}
            className="warm-btn"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
};
```

**User Flow:**
1. User types offensive keyword (e.g., "fuck") in search box
2. **Frontend validates instantly** → Search button becomes disabled
3. User tries to submit anyway (e.g., via Enter key) → Sonner toast error: "Search contains inappropriate language. Please try another topic."
4. If user bypasses frontend (direct API call), **backend validates** → Returns `400` with same error message, frontend displays via toast
5. User cannot proceed until they use appropriate language
6. **Rate limit scenario**: User makes too many searches → Backend returns `429` → Frontend displays via toast: "Rate limit exceeded. Try again in X minutes"

**Testing Checklist for Filter:**
- [ ] Exact match: "fuck" is blocked
- [ ] Case-insensitive: "Fuck", "FUCK" are blocked
- [ ] Leet speak: "f*ck", "f**k", "d1ck", "n1gga" are blocked
- [ ] Partial words: "fucking", "fucked" are blocked (in FORBIDDEN_WORDS list)
- [ ] Mixed: "what the fuck" is blocked
- [ ] Clean content: "love", "peace", "greedy" pass through
- [ ] Frontend: Button disabled when offensive word typed
- [ ] Frontend: Toast shown on submit attempt with offensive word
- [ ] Backend: Direct API call with offensive word returns 400
- [ ] Backend: Error message is clear and actionable
```

**When to use toasts in Phase 6:**
- **Offensive content detection**: `toast.error()` when user submits inappropriate language
- **Rate limiting (429)**: `toast.error()` with retry information from `Retry-After` header
- **Search errors**: `toast.error()` for connection/API failures
- **Success feedback**: `toast.success()` after search starts (optional, navigate away quickly anyway)
```

---

### Phase 7: User Preferences & Localization

**Description:** Add user font preferences (serif/sans-serif, Arabic font selection), force English output in all OpenAI interactions.

**Goals:**

- [ ] **BE**: Add `preferences` JSONB column to User model (stores serif, arabic_font)
- [ ] **BE**: Create Alembic migration for user preferences column
- [ ] **BE**: Update OpenAI prompts to enforce English output ("Respond in English only")
- [ ] **BE**: Create user preferences serializer and API endpoints
- [ ] **BE**: Create user preferences service (`update_preferences()` method)
- [ ] **BE**: Add `PUT /api/users/me/preferences` endpoint with auth
- [ ] **FE**: Create font preferences Zustand store
- [ ] **FE**: Create FontSettings component (serif toggle + Arabic font dropdown)
- [ ] **FE**: Create `/settings` route page
- [ ] **FE**: Add font CSS faces (Scheherazade, Amiri, Droid Arabic Naskh)
- [ ] **FE**: Implement dynamic font styling based on store state
- [ ] **Shared**: Update users API module with `updatePreferences()` method
- [ ] **Shared**: Run `moon run core:generate` to regenerate schema

**Supported Fonts:**
- **English:** Serif toggle (serif/sans-serif via Tailwind)
- **Arabic:** Scheherazade, Amiri, Droid Arabic Naskh (via Google Fonts CDN)

```

---

### Phase 8: Search Deduplication

**Description:** Implement smart search deduplication to reuse existing search results when users search the same topic multiple times.

**Goals:**

- [ ] **BE**: Refactor `search.service.create_search()` to check for existing searches
- [ ] **BE**: Normalize/sanitize topic input (lowercase, trim whitespace)
- [ ] **BE**: Query existing search by user_id/session_id + normalized topic
- [ ] **BE**: If exists, return existing Search record (same slug)
- [ ] **BE**: If not exists, create new Search with generated slug
- [ ] **FE**: No changes needed (existing slug-based routing handles reuse)

**Deduplication Logic:**
```
1. User searches "greedy" → create_search("greedy") → returns slug A
2. User searches "greedy" again → create_search("greedy") → returns slug A (no new record)
3. User searches "GREEDY" (uppercase) → normalized to "greedy" → returns slug A (case-insensitive)
4. User searches "greedy  " (extra spaces) → normalized to "greedy" → returns slug A (whitespace trimmed)
```

---

### Phase 9: Progressive Web App (PWA)

**Description:** Convert the app to a Progressive Web App (PWA) with installable homescreen shortcut and offline caching of search results.

**Goals:**

- [ ] **FE**: Create Web App Manifest (`public/manifest.json`)
- [ ] **FE**: Generate app icons (192x192, 512x512 PNG) in `public/icons/`
- [ ] **FE**: Update `index.html` to link manifest and add PWA meta tags
- [ ] **FE**: Create Service Worker (`src/service-worker.ts`)
- [ ] **FE**: Implement cache-first strategy for static assets (JS, CSS, fonts)
- [ ] **FE**: Implement network-first strategy for API calls with fallback to cache
- [ ] **FE**: Cache search results and verse data on successful fetch
- [ ] **FE**: Register Service Worker in main app initialization
- [ ] **Build**: Configure Vite to copy manifest and service-worker to dist
- [ ] **Testing**: Test install on mobile (Chrome Android, Safari iOS)
- [ ] **Testing**: Test offline mode (disable network, verify cached searches load)

**Service Worker Caching Strategy:**

| Resource Type                      | Strategy                         | TTL     |
| ---------------------------------- | -------------------------------- | ------- |
| Static assets (JS, CSS, fonts)     | Cache-first                      | 1 month |
| API calls (search results, verses) | Network-first, fallback to cache | 7 days  |
| Images (Quranic text)              | Cache-first                      | 1 month |
| Auth endpoints                     | Network-only (no cache)          | N/A     |

**Offline User Experience:**
- Users can view previously searched topics and cached results
- Search button disabled when offline, shows "Offline" state
- Toast notification: "You're offline — viewing cached results"
- Attempt to create new search → error: "Search unavailable offline"
- Attempt to bookmark → error: "Sync when back online"

**PWA Files to Create/Modify:**

- `apps/web/public/manifest.json` — app metadata, icons, colors
- `apps/web/public/icons/icon-192x192.png` — home screen icon (192x192)
- `apps/web/public/icons/icon-512x512.png` — splash screen icon (512x512)
- `apps/web/src/service-worker.ts` — Service Worker with cache strategies
- `apps/web/src/main.tsx` — register Service Worker on app init
- `apps/web/index.html` — link manifest, add PWA meta tags
- `apps/web/vite.config.ts` — configure asset copying for dist

**Testing Checklist:**
- [ ] Lighthouse PWA audit score: 90+
- [ ] Install button appears on mobile (Chrome/Safari)
- [ ] App installs with correct icon and name on homescreen
- [ ] App opens in standalone mode (no browser chrome)
- [ ] Offline: navigate to previously searched topic → loads from cache instantly
- [ ] Offline: try to create new search → button disabled or error shown
- [ ] Back online: app resumes normal functionality
- [ ] Service Worker persists across app restarts
- [ ] Cache updates properly on new deployments

---

## Implementation Roadmap Summary

### Execution Order (with Dependencies)

```
Phase 6: Auth & Security
├─ Backend: Google OAuth setup + rate limiting + forbidden words
├─ Frontend: Google Sign-In button replacement
└─ Shared: Update auth API methods

Phase 7: User Preferences
├─ Backend: Add preferences column + OpenAI English enforcement
├─ Frontend: Font store + settings UI + styling
└─ Shared: Update users API methods

Phase 8: Search Deduplication
├─ Backend: Dedup logic in create_search() service
└─ (No frontend changes needed)

Phase 9: PWA
├─ Frontend: Manifest + Service Worker + icons
├─ HTML: Meta tags
├─ Vite: Asset configuration
└─ Testing: Install + offline verification
```

### Total Effort Estimate

| Phase     | Backend | Frontend | Shared | Migration | Testing | Est. Time     |
| --------- | ------- | -------- | ------ | --------- | ------- | ------------- |
| 6         | 4h      | 2h       | 1h     | —         | 1h      | **8h**        |
| 7         | 3h      | 4h       | 1h     | 1h        | 1h      | **10h**       |
| 8         | 2h      | —        | —      | —         | 1h      | **3h**        |
| 9         | —       | 5h       | —      | —         | 2h      | **7h**        |
| **Total** | **9h**  | **11h**  | **2h** | **1h**    | **5h**  | **~28 hours** |

---

## Key Notes

1. **Phase 6 & 7 can overlap** — they're independent except both need API regeneration
2. **Phase 8 depends on Phase 7** — migration must be applied first
3. **Phase 9 is independent** — can be done in parallel with Phases 6-8
4. **Rate limiting uses Redis** — ensure Redis is running in development/production
5. **Google OAuth requires OAuth credentials** — set up Google Cloud project and add GOOGLE_CLIENT_ID to .env
6. **PWA testing is device-specific** — test on actual mobile devices or Chrome DevTools device emulation
7. **Service Worker cache versioning** — increment CACHE_VERSION on each deployment to invalidate old caches

