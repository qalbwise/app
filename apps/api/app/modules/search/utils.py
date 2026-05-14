import re

BASE_WORDS = {
    # English
    "fuck",
    "fucked",
    "fucking",
    "fuckin",
    "fucker",
    "motherfucker",
    "fucktard",
    "nigga",
    "nigger",
    "bastard",
    "bastrd",
    "dick",
    "dickhead",
    "dickwad",
    "bitch",
    "bitching",
    "bitchass",
    "asshole",
    "asswipe",
    "shit",
    "shithead",
    "bullshit",
    "cunt",
    "slut",
    "whore",
    "pussy",
    "douchebag",
    "jackass",
    "dumbass",
    "cock",
    "cocksucker",
    "twat",
    "prick",
    "wanker",
    "arse",
    "scumbag",
    "goddamn",
    "piss",
    "crap",
    # Indonesian
    "anjing",
    "babi",
    "bangsat",
    "bajingan",
    "brengsek",
    "goblok",
    "tolol",
    "bego",
    "bedebah",
    "bejad",
    "kontol",
    "memek",
    "puki",
    "pukimak",
    "ngentot",
    "asu",
    "jancuk",
    "jancok",
    "kampret",
    "keparat",
    "sialan",
    "sial",
    "tai",
    "ngocok",
    "pepek",
    "pantek",
    "jalang",
    "lonte",
    "perek",
    "sundal",
    "banci",
    "bencong",
    "monyet",
    "setan",
    "kolor",
    "kimak",
    "sange",
    "tempik",
    "jablay",
    "kampungan",
    "dodol",
    "udik",
    "kacung",
}

FORBIDDEN_SEARCH_WORDS = frozenset(BASE_WORDS)


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
        .replace("8", "b")
        .replace("|", "i")
    )
    return normalized == forbidden_word.lower()


def contains_offensive_content(text: str) -> bool:
    words = text.lower().split()
    for word in words:
        if word in FORBIDDEN_SEARCH_WORDS:
            return True
        for forbidden in FORBIDDEN_SEARCH_WORDS:
            if is_leet_speak_variant(word, forbidden):
                return True
    return False


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
