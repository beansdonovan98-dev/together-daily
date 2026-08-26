export type DailySpark = {
  quote: string;
  joke: string;
  riddle: string;
  answer: string;
  word: string;
  definition: string;
  fact: string;
};

export const DAILY_QUOTES = [
  "Love grows in the ordinary moments you choose to notice.",
  "A good day together begins with a little patience and a lot of kindness.",
  "Choose the person, then choose the small acts that make them feel chosen.",
  "Your shared life is made from the tiny moments you keep showing up for.",
  "Gentleness is not small; it is one of the strongest ways to love.",
  "The best teamwork is two people making room for each other to shine.",
  "A home feels warmer when appreciation is spoken out loud.",
  "You do not need a perfect day to make one meaningful moment together.",
];

export const DAILY_MATURE_JOKES = [
  "Our relationship survived because we learned that ‘I’m fine’ is not a status update; it is a natural disaster warning.",
  "We promised not to go to bed angry. Now we stay up until 3 AM, tired, furious, and somehow ordering takeout.",
  "Nothing says commitment like watching your partner spiral over a minor inconvenience and deciding to spiral with them.",
  "Our shared hobby is finding new ways to say ‘I love you’ while quietly judging each other’s driving.",
  "Date night is just two exhausted adults staring at a menu until one says, ‘I do not care,’ and somehow both mean it.",
  "Romance is alive. It is just trapped under a laundry pile and has not been heard from since Tuesday.",
  "We communicate beautifully: one of us overthinks, the other shuts down, and then we both pretend snacks fixed it.",
  "A long-term relationship is basically a two-person survival game with bills, emotions, and one suspiciously loud refrigerator.",
];

export const DAILY_RIDDLES = [
  { riddle: "What can fill a room but takes up no space?", answer: "Light." },
  { riddle: "The more you take, the more you leave behind. What are they?", answer: "Footsteps." },
  { riddle: "What has keys but cannot open locks?", answer: "A piano." },
  { riddle: "What gets wetter the more it dries?", answer: "A towel." },
  { riddle: "What has one eye but cannot see?", answer: "A needle." },
  { riddle: "What can travel around the world while staying in one corner?", answer: "A stamp." },
  { riddle: "What has a neck but no head?", answer: "A bottle." },
  { riddle: "What comes once in a minute, twice in a moment, but never in a thousand years?", answer: "The letter M." },
];

export const DAILY_WORDS = [
  { word: "Serendipity", definition: "A happy discovery made by chance." },
  { word: "Limerence", definition: "An intense, involuntary longing for another person." },
  { word: "Sonder", definition: "The realization that every stranger has a life as complex as your own." },
  { word: "Halcyon", definition: "Calm, peaceful, and happy." },
  { word: "Petrichor", definition: "The earthy scent that follows rain on dry ground." },
  { word: "Eunoia", definition: "Beautiful thinking; a well-disposed mind." },
  { word: "Mellifluous", definition: "Sweet or smooth sounding." },
  { word: "Resilience", definition: "The capacity to recover and keep going after difficulty." },
];

export const DAILY_FACTS = [
  "Octopuses have three hearts, and two of them stop beating when the animal swims.",
  "A day on Venus is longer than a year on Venus because it rotates extremely slowly.",
  "Honey can last for years without spoiling when it is properly sealed.",
  "The human brain uses roughly one-fifth of the body's energy, despite making up only a small fraction of body mass.",
  "Bananas are botanically berries, while strawberries are not.",
  "Sharks existed on Earth before trees appeared.",
  "The Eiffel Tower can grow slightly taller in hot weather as its metal expands.",
  "A group of flamingos is called a flamboyance.",
];

function seedForDate(dateKey: string) {
  return [...dateKey].reduce((total, character, index) => total + character.charCodeAt(0) * (index + 1), 0);
}

export function dailyQuoteFor(dateKey: string, offset = 0) {
  const seed = seedForDate(dateKey);
  return DAILY_QUOTES[(seed + offset) % DAILY_QUOTES.length];
}

export function dailySparkFor(dateKey: string): DailySpark {
  const seed = seedForDate(dateKey);
  return {
    quote: dailyQuoteFor(dateKey),
    joke: DAILY_MATURE_JOKES[(seed * 3 + 1) % DAILY_MATURE_JOKES.length],
    ...DAILY_RIDDLES[(seed * 5 + 2) % DAILY_RIDDLES.length],
    ...DAILY_WORDS[(seed * 7 + 3) % DAILY_WORDS.length],
    fact: DAILY_FACTS[(seed * 11 + 5) % DAILY_FACTS.length],
  };
}
