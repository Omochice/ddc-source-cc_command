import type { Item } from "jsr:@shougo/ddc-vim@10.3.0/types";
import { parse as parseYaml } from "jsr:@std/yaml@1";
import { join } from "jsr:@std/path@1";

export async function collectGlobal(configDir: string): Promise<Item[]> {
  const items: Item[] = [];

  const commandsDir = join(configDir, "commands");
  for await (const entry of safeReadDir(commandsDir)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    const word = "/" + entry.name.slice(0, -".md".length);
    const info = await readDescription(join(commandsDir, entry.name));
    items.push({ word, info });
  }

  const skillsDir = join(configDir, "skills");
  for await (const entry of safeReadDir(skillsDir)) {
    if (!entry.isDirectory) continue;
    const word = "/" + entry.name;
    const description = await readDescription(
      join(skillsDir, entry.name, "SKILL.md"),
    );
    const info = description === "" ? "" : `${description} (skill)`;
    items.push({ word, info });
  }

  return items;
}

export function collectLocal(
  _startDir: string,
  _homeDir: string,
): Promise<Item[]> {
  throw new Error("not implemented");
}

async function* safeReadDir(
  dir: string,
): AsyncGenerator<Deno.DirEntry, void, void> {
  try {
    for await (const entry of Deno.readDir(dir)) {
      yield entry;
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return;
    throw err;
  }
}

async function readDescription(path: string): Promise<string> {
  const text = await Deno.readTextFile(path);
  const fm = extractFrontmatter(text);
  if (fm === null) return "";
  const parsed = parseYaml(fm) as Record<string, unknown> | null;
  const description = parsed?.["description"];
  return typeof description === "string" ? description : "";
}

function extractFrontmatter(text: string): string | null {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return null;
  return text.slice(4, end);
}
