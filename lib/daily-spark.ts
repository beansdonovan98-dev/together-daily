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
  "Our relationship survived because we communicate openly, except during the drive home when we are both pretending the GPS is the problem.",
  "We agreed to be honest with each other. Then one of us asked, ‘Do you really need another blanket?’ and peace left the chat.",
  "Couples therapy is expensive, so we stare silently at the dishwasher until somebody says sorry.",
  "We tried role-play once: one of us was organized and the other one believed them.",
  "Our date night got wild. We ordered appetizers and checked the bank app without crying.",
  "The bedroom spark is alive and well; it is just currently trapped under three loads of laundry and a charger cable.",
  "We promised not to go to bed angry. Now we stay up angry, hydrated, and increasingly dramatic.",
  "Our shared hobby is spending forty minutes choosing food, then eating snacks over the sink like raccoons with a joint checking account.",
];

function seedForDate(dateKey: string) {
  return [...dateKey].reduce(
    (total, character, index) => total + character.charCodeAt(0) * (index + 1),
    0,
  );
}

export function dailySparkFor(dateKey: string, quoteOffset = 0): DailySpark {
  const seed = seedForDate(dateKey);
  const normalizedQuoteOffset = Math.max(0, Math.floor(quoteOffset)) % DAILY_QUOTES.length;
  return {
    quote: DAILY_QUOTES[(seed + normalizedQuoteOffset) % DAILY_QUOTES.length],
    joke: DAILY_MATURE_JOKES[(seed * 3 + 1) % DAILY_MATURE_JOKES.length],
  };
}

export function nextQuoteOffset(currentOffset: number) {
  return (Math.max(0, Math.floor(currentOffset)) + 1) % DAILY_QUOTES.length;
}
