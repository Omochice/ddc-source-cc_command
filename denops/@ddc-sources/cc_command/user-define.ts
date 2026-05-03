import type { Item } from "jsr:@shougo/ddc-vim@10.3.0/types";

const CLAUDE_CONFIG_DIR = Deno.env.get("CLAUDE_CONFIG_DIR") ?? "{{home}}";

export async function collectGlobal(): Promise<Item[]> {
  return await Promise.all([
    collectGlobalSkills(),
    collectGlobalCommands(),
  ]).then((e) => e.flat());
}

async function collectGlobalSkills(): Promise<Item[]> {}

async function collectGlobalCommands(): Promise<Item[]> {}

export async function collectLocal(): Promise<Item[]> {
  return await Promise.all([
    collectLocalSkills(),
    collectLocalCommands(),
  ]).then((e) => e.flat());
}

async function collectLocalSkills(): Promise<Item[]> {}

async function collectLocalCommands(): Promise<Item[]> {}
