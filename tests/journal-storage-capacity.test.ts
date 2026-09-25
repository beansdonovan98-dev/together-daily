import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("shared journal storage capacity", () => {
  it("keeps the room journal in LONGTEXT rather than a 64 KB TEXT column", () => {
    const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
    const migration = readFileSync(resolve(process.cwd(), "drizzle/0005_hard_mac_gargan.sql"), "utf8");

    expect(schema).toContain('journalState: longtext("journalState").notNull()');
    expect(migration).toContain("ALTER TABLE `guest_rooms` MODIFY COLUMN `journalState` longtext NOT NULL;");
    expect(migration).not.toContain("guest_room_push_tokens");
  });
});
