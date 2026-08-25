# API Context

The backend that accepts a topic, runs a semantic search over the Quran, and serves verse results plus user data (bookmarks, notes, preferences). It is the source of truth for all vocabulary used across the app.

## Language

### Search

**Topic**:
A user's stated theme or concern, expressed in their own words (e.g. "grief", "fear of failure"). The search input is a topic, not a keyword query.
_Avoid_: query, search term, prompt, thought

**Verse**:
A single Quranic verse (`surah:ayah`, e.g. `2:255`) returned as a search result. The wire schema is `VerseResult`; the persisted row is `TopicResult`.
_Avoid_: result, ayah, chapter

**Surah**:
A chapter of the Quran. Referenced by name and number; the Quran Foundation content API calls these "chapters" but the app does not.
_Avoid_: chapter

**Tafsir**:
Scholar commentary on a verse, served as an excerpt with an author and edition.
_Avoid_: commentary, explanation, exegesis

**Why-this-verse**:
An AI-generated explanation connecting a verse's context to the user's topic. Persisted as `why_this_verse`; `explain` is API plumbing.
_Avoid_: explain, explanation, reasoning

### User data

**Bookmark**:
A saved verse, synced with the user's Quran Foundation Favorites collection.
_Avoid_: favorite, saved verse, collection

**Note**:
A user-written note attached to a topic string, with optional verse references.
_Avoid_: memo, journal, comment

**User**:
A signed-in person, identified by OAuth (Google or Quran Foundation). Distinct from the anonymous `session_id` used for non-signed-in searches.
_Avoid_: account, member, profile

**Preferences**:
Server-persisted reading choices: `serif` (Latin/UI serif stack) and `arabic_font` (`hafs_quran` or `indopak`). Arabic font *size* is local rendering state, not a preference.
_Avoid_: settings, configuration, font size

### Deployment

**Image**:
A versioned container artifact pushed to GHCR (`ghcr.io/qalbwise/app/api:main`, `ghcr.io/qalbwise/app/web:main`) and pulled by the VM. The api Image is single — compose's `command:` selects whether a container runs uvicorn or celery.
_Avoid_: build, container (when referring to the published artifact)

**VM**:
The production host. It holds only `docker-compose.yml` and a gitignored `.env`; it has no source checkout and never builds images.
_Avoid_: server, host (when referring to the deploy target)

**Build-time env**:
Values baked into an Image at build time (web `VITE_*` vars). Changing them requires a rebuild + push. Distinct from runtime env, which the VM's `.env` provides.
_Avoid_: environment variables (ambiguous), config

**Runtime env**:
Values the VM's gitignored `.env` file provides to containers at start (secrets, `DATABASE_URL`). Never baked into an Image.
_Avoid_: environment variables (ambiguous), config
