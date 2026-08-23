# Web Context

The Quran reader experience: topic search, verse display with tafsir and why-this-verse, bookmarks, notes, and reading settings. All vocabulary is defined by the API context; this context only adds reader-specific terms.

## Language

### Reading

**Reading settings**:
The user-visible drawer controlling script/font, serif stack, and Arabic font size. Persisted choices (`serif`, `arabic_font`) are Preferences (API context); the Arabic font *size* step is local rendering state that never reaches the server.
_Avoid_: preferences (when referring to font size), appearance settings

**Verse card**:
The UI component rendering a single verse result: Arabic text, translation, why-this-verse, and tafsir.
_Avoid_: result card, ayah card

### Session

**qalb**:
Brand voice for the user's inner state — what they bring to a search. Marketing copy only; not a domain concept in the API.
_Avoid_: mind, feelings (in product copy)
