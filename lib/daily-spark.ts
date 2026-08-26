export type DailySpark = {
  quote: string;
  joke: string;
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
  "Our relationship is built on trust, communication, and pretending neither of us saw the online shopping total.",
  "We said we would go to bed early, then opened one tiny argument from 2017 and suddenly it was 1:30 AM.",
  "We split chores fairly: one of us creates the mess, and one of us creates a spreadsheet about the mess.",
  "Our love language is sending memes instead of discussing why we are both annoyed.",
  "Date night is expensive, so we stared into the fridge and critiqued each other’s leftovers.",
  "Romance is not dead; it is exhausted, under-caffeinated, and hiding from the laundry.",
  "We tried couples yoga. Now we are both sore and suspicious of the person who said, ‘one more stretch.’",
  "The secret to a long relationship is simple: apologize quickly, snack often, and do not start serious talks at bedtime.",
];

function seedForDate(dateKey: string) {
  return [...dateKey].reduce(
    (total, character, index) => total + character.charCodeAt(0) * (index + 1),
    0,
  );
}

export function dailySparkFor(dateKey: string): DailySpark {
  const seed = seedForDate(dateKey);
  return {
    quote: DAILY_QUOTES[seed % DAILY_QUOTES.length],
    joke: DAILY_MATURE_JOKES[(seed * 3 + 1) % DAILY_MATURE_JOKES.length],
  };
}
