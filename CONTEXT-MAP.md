# Context Map

## Contexts

- [API](./apps/api/CONTEXT.md) — serves topic search, verse results, and user data (bookmarks, notes, preferences)
- [Web](./apps/web/CONTEXT.md) — the Quran reader experience: search UI, verse display, reading settings

## Relationships

- **Web → API**: the web app is the API's only client; it calls `api.{feature}.{method}` from `@repo/core`, which is auto-typed from the API's OpenAPI schema. Vocabulary is defined by the API context; the web context does not redefine it.
- **Web ↔ API**: shared vocabulary for `Topic`, `VerseResult`, `Bookmark`, `Note`, `UserPreferences` (persisted via `packages/core` types).
- **API → external**: the API proxies Quran content from Quran Foundation and quran.com, and uses the `quran.ai` MCP server for semantic search and tafsir.
