import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StaticVerse {
  text: string;
  reference: string;
}

const staticVerses: StaticVerse[] = [
  {
    text: "There truly is a reminder in this for whoever has a heart, whoever listens attentively.",
    reference: "50:37",
  },
  {
    text: "Truly it is in the remembrance of Allah that hearts find peace.",
    reference: "13:28",
  },
  {
    text: "So truly where there is hardship there is also ease; truly where there is hardship there is also ease.",
    reference: "94:5-6",
  },
  {
    text: "Allah does not burden any soul with more than it can bear.",
    reference: "2:286",
  },
  {
    text: "Do not lose heart or despair — if you are true believers you have the upper hand.",
    reference: "3:139",
  },
  {
    text: "Do not despair of Allah's mercy. Allah forgives all sins: He is truly the Most Forgiving, the Most Merciful.",
    reference: "39:53",
  },
  {
    text: "Do not grieve; do not be distressed.",
    reference: "16:127",
  },
  {
    text: "If you tried to count Allah's blessings, you could never take them all in.",
    reference: "16:18",
  },
  {
    text: "In Allah's grace and mercy let them rejoice: these are better than all they accumulate.",
    reference: "10:58",
  },
  {
    text: "Praise be to Allah, who has separated us from all sorrow!",
    reference: "35:34",
  },
];

export function getRandomVerse(): StaticVerse {
  return staticVerses[Math.floor(Math.random() * staticVerses.length)];
}
