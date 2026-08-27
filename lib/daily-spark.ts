export type DailySpark = {
  quote: string;
  joke: string;
  riddle: { prompt: string; answer: string };
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
  "We promised ‘in sickness and in health.’ Nobody said this included a 3 AM thermostat argument conducted like hostage negotiations.",
  "Marriage is two people building a home, then taking turns being haunted by the other person’s laundry mountain.",
  "Our communication is so advanced we can ruin each other’s mood with one sigh from the next room.",
  "We address problems in this relationship. Then resurrect them, polish them, and invite them back to dinner.",
  "Love is beautiful: you slowly realize their weird family is now your weird family with a group chat.",
  "Date night: we got dressed up to sit across from each other in silence and calculate a tip.",
  "We do not hold grudges. We file them alphabetically and review the archive whenever someone says, ‘Nothing’s wrong.’",
  "We are soulmates. That is why our mutual exhaustion feels spiritually binding.",
];

export const DAILY_RIDDLES = [
  { prompt: "What can fill a room but takes up no space?", answer: "Light." },
  { prompt: "What has many keys but cannot open a single lock?", answer: "A piano." },
  { prompt: "What gets wetter the more it dries?", answer: "A towel." },
  { prompt: "What can travel around the world while staying in one corner?", answer: "A stamp." },
  { prompt: "What has one eye but cannot see?", answer: "A needle." },
  { prompt: "What has hands but cannot clap?", answer: "A clock." },
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
  };
}
