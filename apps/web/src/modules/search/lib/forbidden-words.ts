const BASE_WORDS = [
  // English
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
  // Indonesian
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
];

export const FORBIDDEN_WORDS = new Set(BASE_WORDS);

export function isLeetSpeakVariant(
  word: string,
  forbiddenWord: string
): boolean {
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
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/\|/g, "i");
  return normalized === forbiddenWord.toLowerCase();
}

export function containsOffensiveContent(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/);

  for (const word of words) {
    if (FORBIDDEN_WORDS.has(word)) return true;

    for (const forbidden of FORBIDDEN_WORDS) {
      if (isLeetSpeakVariant(word, forbidden)) return true;
    }
  }

  return false;
}
