import re

FORBIDDEN_SEARCH_WORDS = {
    "fuck",
    "fucked",
    "fucking",
    "f*ck",
    "f**k",
    "fck",
    "nigga",
    "nigger",
    "n1gga",
    "n1gg4",
    "ngga",
    "bastard",
    "b4stard",
    "bastrd",
    "dick",
    "d1ck",
    "d!ck",
    "dck",
    "bitch",
    "b1tch",
    "b!tch",
    "asshole",
    "a$$hole",
    "@sshole",
    "shit",
    "sh1t",
    "sh!t",
}


def is_leet_speak_variant(word: str, forbidden_word: str) -> bool:
    normalized = (
        word.lower()
        .replace("1", "i")
        .replace("3", "e")
        .replace("@", "a")
        .replace("$", "s")
        .replace("!", "i")
        .replace("0", "o")
        .replace("4", "a")
        .replace("5", "s")
        .replace("7", "t")
    )
    return normalized == forbidden_word.lower()


def normalize_query(raw: str) -> str:
    normalized = raw.strip().lower()
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.strip(" .,!?;:")


def slugify_query(query: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", query.lower()).strip("-")
    return slug[:70] or "topic"


def serialize_result(result) -> dict:
    return {
        "ayah_key": result.ayah_key,
        "surah_name": result.surah_name,
        "arabic_text": result.arabic_text,
        "translation": result.translation,
        "translator": "Saheeh International",
        "relevance_score": result.relevance_score,
        "url": result.url,
        "why_this_verse": result.why_this_verse,
        "tafsir_excerpt": result.tafsir_excerpt,
        "tafsir_author": result.tafsir_author,
        "tafsir_edition": result.tafsir_edition,
    }


def serialize_results(results: list) -> list[dict]:
    ordered_results = sorted(results, key=lambda r: r.rank)
    return [serialize_result(result) for result in ordered_results]
