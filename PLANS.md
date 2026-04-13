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

## Phase 2: Search Feature (Core)

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

## Phase 3: Results & UI

**Description:** Build the frontend search results page with verse cards, tafsir expansion, and SSE integration.

**Goals:**

- [ ] **FE**: Create search route page (`/search/:slug`)
- [ ] **FE**: Implement SSE hook for real-time progress
- [ ] **FE**: Create verse card component
- [ ] **FE**: Implement "Why this verse" expansion
- [ ] **FE**: Add tafsir fetch and display
- [ ] **FE**: Add TanStack Query polling fallback
- [ ] **FE**: Create topic chips on home page

---

## Phase 4: Bookmarks & User Features

**Description:** Implement local bookmarks, notes, and streak tracking (replaced QF User APIs with local implementation).

**Goals:**

- [x] **BE**: Create bookmark serializer and router
- [x] **BE**: Implement local Bookmarks API (stored in our DB)
- [x] **BE**: Create notes/journal endpoints
- [x] **BE**: Implement streak tracking endpoints (local, not QF)
- [ ] **FE**: Add login sheet UI component
- [ ] **FE**: Create post-login home with streak widget

---

## Phase 5: Polish & Submission

**Description:** Final polish, testing, and hackathon submission preparation.

**Goals:**

- [ ] Add share functionality
- [ ] Create collections feature (nice-to-have)
- [ ] Test SSE on mobile networks
- [ ] Add fallback static results for demo
- [ ] Verify Arabic text rendering
- [ ] Run full integration tests
- [ ] Prepare demo startup script
