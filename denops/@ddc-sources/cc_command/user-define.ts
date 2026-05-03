import type { Item } from "jsr:@shougo/ddc-vim@10.3.0/types";
import { parse as parseYaml } from "jsr:@std/yaml@1";
import { dirname, join, resolve } from "jsr:@std/path@1";

export async function collectGlobal(configDir: string): Promise<Item[]> {
  const items: Item[] = [];

  await collectCommands(join(configDir, "commands"), [], items);

  const skillsDir = join(configDir, "skills");
  for await (const entry of safeReadDir(skillsDir)) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    const path = join(skillsDir, entry.name);
    const kind = await resolveKind(entry, path);
    if (kind !== "directory") {
      continue;
    }
    const word = `/${entry.name}`;
    const description = await readDescription(join(path, "SKILL.md"));
    const info = description === "" ? "" : `${description} (skill)`;
    items.push({ word, info });
  }

  return items;
}

async function collectCommands(
  dir: string,
  segments: string[],
  out: Item[],
): Promise<void> {
  for await (const entry of safeReadDir(dir)) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    const path = join(dir, entry.name);
    const kind = await resolveKind(entry, path);
    if (kind === "directory") {
      await collectCommands(path, [...segments, entry.name], out);
      continue;
    }
    if (kind !== "file" || !entry.name.endsWith(".md")) continue;
    const base = entry.name.slice(0, -".md".length);
    const word = "/" + [...segments, base].join(":");
    const info = await readDescription(path);
    out.push({ word, info });
  }
}

async function resolveKind(
  entry: Deno.DirEntry,
  path: string,
): Promise<"file" | "directory" | "other"> {
  if (entry.isFile) {
    return "file";
  }
  if (entry.isDirectory) {
    return "directory";
  }
  if (!entry.isSymlink) {
    return "other";
  }
  try {
    const stat = await Deno.stat(path);
    if (stat.isFile) {
      return "file";
    }
    if (stat.isDirectory) {
      return "directory";
    }
    return "other";
  } catch {
    return "other";
  }
}

export async function collectLocal(
  startDir: string,
  homeDir: string,
): Promise<Item[]> {
  const home = resolve(homeDir);
  let current = resolve(startDir);
  while (true) {
    if (current === home) {
      return [];
    }
    const candidate = join(current, ".claude");
    if (await isDirectory(candidate)) {
      return await collectGlobal(candidate);
    }
    const parent = dirname(current);
    if (parent === current) {
      return [];
    }
    current = parent;
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isDirectory;
  } catch {
    return false;
  }
}

async function* safeReadDir(
  dir: string,
): AsyncGenerator<Deno.DirEntry, void, void> {
  try {
    for await (const entry of Deno.readDir(dir)) {
      yield entry;
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return;
    }
    throw err;
  }
}

async function readDescription(path: string): Promise<string> {
  const text = await (async () => {
    try {
      return await Deno.readTextFile(path);
    } catch {
      return "";
    }
  })();
  const fm = extractFrontmatter(text);
  if (fm === null) {
    return "";
  }
  const parsed: Record<string, unknown> | null = (() => {
    try {
      return parseYaml(fm) as Record<string, unknown> | null;
    } catch (err) {
      console.warn(`failed to parse frontmatter in ${path}: ${err}`);
      return null
    }
  })();
  const description = parsed?.["description"];
  return typeof description === "string" ? description : "";
}

function extractFrontmatter(text: string): string | null {
  if (!text.startsWith("---\n")) {
    return null;
  }
  const end = text.indexOf("\n---", 4);
  if (end === -1) {
    return null;
  }
  return text.slice(4, end);
}
