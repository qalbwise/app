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
