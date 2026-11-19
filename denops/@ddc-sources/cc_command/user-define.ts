import type { Item } from "jsr:@shougo/ddc-vim@10.3.0/types";
import { basename, dirname, join, resolve } from "jsr:@std/path@1.1.6";

import { parseDescription } from "../../ddc-source-cc_command/parse-frontmatter/mod.ts";
import { pathKind, readDirEntries, readTextFileSafe } from "./fs.ts";

const MAX_COMMAND_DEPTH = 16;

/**
 * Builds the completion word of a skill from the name of its directory.
 */
export type SkillWord = (directoryName: string) => string;

/**
 * Returns a {@link SkillWord} that joins `prefix` and the directory name with
 * `:`, as Claude Code does for skills under a `skills` directory.
 */
export function prefixedSkillWord(prefix: string[]): SkillWord {
  return (directoryName) => `/${[...prefix, directoryName].join(":")}`;
}

/**
 * Collects commands and skills from a directory laid out like `.claude`.
 *
 * Reads `<dir>/commands` recursively and `<dir>/skills` at one level,
 * returning ddc completion items.
 * Missing directories yield an empty list rather than an error.
 *
 * @param dir Absolute path to a config directory or project `.claude` directory.
 */
export async function collectCommandsAndSkills(dir: string): Promise<Item[]> {
  const [commands, skills] = await Promise.all([
    collectCommands(join(dir, "commands"), []),
    collectSkills(join(dir, "skills"), prefixedSkillWord([])),
  ]);
  return [...commands, ...skills];
}

/**
 * Collects the `.md` command files under `dir`, recursively.
 *
 * Each subdirectory adds its name as a `:`-separated segment, and dotfiles
 * are skipped.
 *
 * @param dir Directory to scan; a missing one yields `[]`.
 * @param segments Segments placed before every command name, such as a plugin namespace.
 */
export function collectCommands(
  dir: string,
  segments: string[],
): Promise<Item[]> {
  return collectCommandsBelow(dir, segments, 0);
}

async function collectCommandsBelow(
  dir: string,
  segments: string[],
  depth: number,
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
  const kind = await pathKind(path, entry);
  if (kind === "directory") {
    return collectCommandsBelow(path, [...segments, entry.name], depth + 1);
  }
  if (kind !== "file" || !entry.name.endsWith(".md")) {
    return [];
  }
  const base = entry.name.slice(0, -".md".length);
  return [await commandItem(path, `/${[...segments, base].join(":")}`)];
}

/**
 * Builds the completion item of one command file.
 *
 * @param path Path to the command's Markdown file.
 * @param word The completion word, including the leading `/`.
 * @returns An item whose `info` is the frontmatter description, when there is one.
 */
export async function commandItem(path: string, word: string): Promise<Item> {
  const text = await readTextFileSafe(path);
  if (text == null) {
    return { word };
  }
  const info = parseDescription(text);
  return info === "" ? { word } : { word, info };
}

/**
 * Collects the skills in `skillsDir`, one per subdirectory holding `SKILL.md`.
 *
 * @param skillsDir Directory to scan; a missing one yields `[]`.
 * @param word Builds each skill's completion word.
 */
export async function collectSkills(
  skillsDir: string,
  word: SkillWord,
): Promise<Item[]> {
  const entries = await readDirEntries(skillsDir);
  const items = await Promise.all(
    entries.map(async (entry) => {
      if (entry.name.startsWith(".")) {
        return null;
      }
      const path = join(skillsDir, entry.name);
      if (await pathKind(path, entry) !== "directory") {
        return null;
      }
      return skillItem(path, word);
    }),
  );
  return items.filter((item): item is Item => item != null);
}

/**
 * Builds the completion item of the skill whose `SKILL.md` sits directly in
 * `skillDir`.
 *
 * @param skillDir The skill's own directory.
 * @param word Builds the completion word from the directory's name.
 * @returns The item, or `null` when `skillDir` holds no `SKILL.md`.
 */
export async function skillItem(
  skillDir: string,
  word: SkillWord,
): Promise<Item | null> {
  const skillFile = join(skillDir, "SKILL.md");
  if (await pathKind(skillFile) !== "file") {
    return null;
  }
  const item = { word: word(basename(skillDir)) };
  const text = await readTextFileSafe(skillFile);
  if (text == null) {
    return item;
  }
  const description = parseDescription(text);
  return description === "" ? item : { ...item, info: description };
}

/**
 * Finds the nearest project-local `.claude` directory.
 *
 * Walks up from `startDir` toward the filesystem root and stops at `homeDir`
 * so that the user's global config is never mistaken for a project's.
 *
 * @param startDir Directory to start searching from (typically the cwd).
 * @param homeDir The user's home directory; the search never enters or passes it.
 * @returns The absolute path of the `.claude` directory, or `null` if none exists.
 */
export async function findProjectClaudeDir(
  startDir: string,
  homeDir: string,
): Promise<string | null> {
  const home = resolve(homeDir);
  let current = resolve(startDir);
  while (true) {
    if (current === home) {
      return null;
    }
    const candidate = join(current, ".claude");
    if (await pathKind(candidate) === "directory") {
      return candidate;
    }
    const parent = dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}
