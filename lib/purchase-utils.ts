export type GroceryCleanupItem = { category: string; purchased: boolean; purchasedOn?: string };

export function clearPurchasedGroceriesFromPreviousDays<T extends GroceryCleanupItem>(items: T[], today: string): T[] {
  return items.filter((item) => !(item.category === "groceries" && item.purchased && item.purchasedOn && item.purchasedOn < today));
}
