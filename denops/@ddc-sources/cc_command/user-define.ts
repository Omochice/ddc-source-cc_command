import type { Item } from "jsr:@shougo/ddc-vim@10.3.0/types";
import { extract } from "jsr:@std/front-matter@1/yaml";
import { test as hasFrontmatter } from "jsr:@std/front-matter@1/test";
import { dirname, join, resolve } from "jsr:@std/path@1";

const MAX_COMMAND_DEPTH = 16;

export async function collectGlobal(configDir: string): Promise<Item[]> {
  const [commands, skills] = await Promise.all([
    collectCommands(join(configDir, "commands"), []),
    collectSkills(join(configDir, "skills")),
  ]);
  return [...commands, ...skills];
}

async function collectCommands(
  dir: string,
  segments: string[],
  depth = 0,
): Promise<Item[]> {
  if (depth > MAX_COMMAND_DEPTH) {
    return [];
  }
  const entries = await readDirEntries(dir);
  const groups = await Promise.all(
    entries.map((entry) => commandEntryItems(dir, entry, segments, depth)),
  );
  return groups.flat();
}

async function commandEntryItems(
  dir: string,
  entry: Deno.DirEntry,
  segments: string[],
  depth: number,
): Promise<Item[]> {
  if (entry.name.startsWith(".")) {
    return [];
  }
  const path = join(dir, entry.name);
  const kind = await resolveKind(entry, path);
  if (kind === "directory") {
    return collectCommands(path, [...segments, entry.name], depth + 1);
  }
  if (kind !== "file" || !entry.name.endsWith(".md")) {
    return [];
  }
  const base = entry.name.slice(0, -".md".length);
  const word = `/${[...segments, base].join(":")}`;
  const info = await readDescription(path);
  return [{ word, info }];
}

async function collectSkills(skillsDir: string): Promise<Item[]> {
  const entries = await readDirEntries(skillsDir);
  const items = await Promise.all(
    entries.map((entry) => skillEntryItem(skillsDir, entry)),
  );
  return items.filter((item): item is Item => item !== null);
}

async function skillEntryItem(
  skillsDir: string,
  entry: Deno.DirEntry,
): Promise<Item | null> {
  if (entry.name.startsWith(".")) {
    return null;
  }
  const path = join(skillsDir, entry.name);
  const kind = await resolveKind(entry, path);
  if (kind !== "directory") {
    return null;
  }
  const description = await readDescription(join(path, "SKILL.md"));
  const info = description === "" ? "" : `${description} (skill)`;
  return { word: `/${entry.name}`, info };
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

async function readDirEntries(dir: string): Promise<Deno.DirEntry[]> {
  try {
    const entries: Deno.DirEntry[] = [];
    for await (const entry of Deno.readDir(dir)) {
      entries.push(entry);
    }
    return entries;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return [];
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
  if (!hasFrontmatter(text, ["yaml"])) {
    return "";
  }
  const attrs = (() => {
    try {
      return extract<Record<string, unknown>>(text).attrs;
    } catch (err) {
      console.warn(`failed to parse frontmatter in ${path}: ${err}`);
      return null;
    }
  })();
  if (attrs === null) {
    return "";
  }
  const description = attrs["description"];
  return typeof description === "string" ? description : "";
}
