import { createDetector } from "profanity-kit/core";
import { english } from "profanity-kit/languages/en";
import { indonesian } from "profanity-kit/languages/id";

const profanityDetector = createDetector({
  languages: [english, indonesian],
});

export function containsOffensiveContent(text: string): boolean {
  return profanityDetector.check(text);
}
