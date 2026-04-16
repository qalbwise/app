export const FORBIDDEN_WORDS = new Set([
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
]);

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
    .replace(/7/g, "t");
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
