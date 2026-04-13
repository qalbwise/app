# Qalbwise Implementation Plans

## MVP Development Phases

### Phase 1: Foundation & Authentication

**Description:** Setup the core infrastructure including database connection, authentication system with JWT tokens, and user management.

**Goals:**

- [x] Setup PostgreSQL database connection
- [x] Create User SQLAlchemy model
- [x] Create Profile SQLAlchemy model
- [x] Setup Alembic migration
- [x] Implement password hashing (bcrypt)
- [x] Create auth serializer (Pydantic schemas)
- [x] Create auth router (FastAPI routes)
- [x] Implement auth service (login, register, logout)
- [x] JWT access token generation
- [x] JWT refresh token generation
- [x] Token refresh endpoint
- [x] Protected route dependency (get_current_user)

---

## Phase 2: Search Feature (Core)

**Description:** Implement the core topic-first search feature with slug-based URLs, SSE progress streaming, and Celery background processing.

**Goals:**

- [x] Create Search SQLAlchemy model (slug, topic, status, step, raw_results, results, session_id, user_id)
- [x] Setup Alembic migration for Search model
- [x] Create search serializer (Pydantic schemas)
- [x] Create search router (FastAPI routes)
- [x] Implement search service (create, get, streaming)
- [x] Implement search Celery task (QF MCP + OpenAI ranking)
- [x] Add QF MCP client for content retrieval
- [x] Add OpenAI SDK client for semantic ranking
- [x] Create GET /api/searches endpoint (history)
- [x] Integrate search router in main.py
- [x] Import Search model in alembic/env.py

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

- [ ] Create search route page (`/search/:slug`)
- [ ] Implement SSE hook for real-time progress
- [ ] Create verse card component
- [ ] Implement "Why this verse" expansion
- [ ] Add tafsir fetch and display
- [ ] Add TanStack Query polling fallback
- [ ] Create topic chips on home page

---

## Phase 4: Bookmarks & User Features

**Description:** Implement QF User APIs for bookmarks, notes, and streak tracking.

**Goals:**

- [ ] Create bookmark serializer and router
- [ ] Implement QF Bookmarks API integration
- [ ] Create notes/journal endpoints
- [ ] Implement streak tracking endpoints
- [ ] Add login sheet UI component
- [ ] Create post-login home with streak widget

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
