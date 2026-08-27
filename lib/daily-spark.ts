export type DailySpark = {
  quote: string;
  joke: string;
  riddle: { prompt: string; answer: string };
  word: { term: string; definition: string };
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
  "Our relationship is not toxic. It is simply an abandoned amusement park where every ride is called ‘Let’s Talk About It.’",
  "We do not revisit old arguments. We exhume them, dress them nicely, and make them sit between us at dinner.",
  "Love is knowing someone well enough to predict the exact sentence that will turn a peaceful evening into a three-act tragedy.",
  "We never go to bed angry. We stay up until the Wi-Fi dies and one of us mutters a legally meaningless apology.",
  "Our home is not haunted; that is just the emotional residue of every ‘I’m fine’ still pacing the hallway.",
  "Date night is expensive couples therapy with appetizers and a server who keeps asking if everything is okay.",
  "We call it compromise when both people lose quietly and agree the dishwasher is now the real enemy.",
  "The romance is alive. It is just buried under bills, laundry, and a very suspicious amount of eye contact.",
];

export const DAILY_RIDDLES = [
  { prompt: "What can fill a room but takes up no space?", answer: "Light." },
  { prompt: "What has many keys but cannot open a single lock?", answer: "A piano." },
  { prompt: "What gets wetter the more it dries?", answer: "A towel." },
  { prompt: "What can travel around the world while staying in one corner?", answer: "A stamp." },
  { prompt: "What has one eye but cannot see?", answer: "A needle." },
  { prompt: "What has hands but cannot clap?", answer: "A clock." },
];

export const DAILY_WORDS = [
  { term: "Serendipity", definition: "A happy discovery made by chance." },
  { term: "Luminous", definition: "Giving off light; bright and glowing." },
  { term: "Resilient", definition: "Able to recover and adapt after difficulty." },
  { term: "Kinship", definition: "A close connection or shared bond." },
  { term: "Eloquent", definition: "Fluent, expressive, and persuasive in language." },
  { term: "Sonder", definition: "The realization that every stranger has a life as vivid as your own." },
];

export const DAILY_FACTS = [
  "Honey can remain edible for an exceptionally long time because its low moisture and natural acidity make it difficult for many microbes to grow.",
  "Octopuses have three hearts: two move blood toward the gills and one circulates it around the body.",
  "The first email sent over ARPANET in 1971 is widely credited to computer engineer Ray Tomlinson.",
  "A day on Venus is longer than a Venus year because Venus rotates very slowly on its axis.",
  "The Eiffel Tower can become taller in summer as its metal structure expands in heat.",
  "Bananas are botanically berries, while strawberries are not berries by the botanical definition.",
];

function seedForDate(dateKey: string) {
  return [...dateKey].reduce(
    (total, character, index) => total + character.charCodeAt(0) * (index + 1),
    0,
  );
}

export function dailySparkFor(dateKey: string, quoteOffset = 0): DailySpark {
  const seed = seedForDate(dateKey);
  return {
    quote: DAILY_QUOTES[(seed + quoteOffset) % DAILY_QUOTES.length],
    joke: DAILY_MATURE_JOKES[(seed * 3 + 1) % DAILY_MATURE_JOKES.length],
    riddle: DAILY_RIDDLES[(seed * 5 + 2) % DAILY_RIDDLES.length],
    word: DAILY_WORDS[(seed * 7 + 3) % DAILY_WORDS.length],
    fact: DAILY_FACTS[(seed * 11 + 4) % DAILY_FACTS.length],
  };
}
