import type { Item } from "jsr:@shougo/ddc-vim@10.3.0/types";
import {
  basename,
  isAbsolute,
  join,
  relative,
  resolve,
  SEPARATOR,
} from "jsr:@std/path@1.1.6";

import { parseFrontmatter } from "../../ddc-source-cc_command/parse-frontmatter/mod.ts";
import { pathKind } from "./fs.ts";
import { isRecord, type JsonObject, readJson } from "./json.ts";
import {
  collectCommands,
  collectSkills,
  commandItem,
  skillItem,
  type SkillWord,
} from "./user-define.ts";

async function readManifest(root: string): Promise<JsonObject> {
  const manifest = await readJson(join(root, ".claude-plugin", "plugin.json"));
  return isRecord(manifest) ? manifest : {};
}

/**
 * Claude Code drops a component path that resolves outside the plugin root
 * rather than reading files the plugin does not own.
 */
function insidePlugin(root: string, path: unknown): string | null {
  if (typeof path !== "string") {
    return null;
  }
  const full = resolve(root, path);
  const rel = relative(root, full);
  if (rel === ".." || rel.startsWith(`..${SEPARATOR}`) || isAbsolute(rel)) {
    return null;
  }
  return full;
}

function declaredPaths(root: string, spec: unknown): string[] {
  return (Array.isArray(spec) ? spec : [spec])
    .map((path) => insidePlugin(root, path))
    .filter((path): path is string => path != null);
}

/**
 * Claude Code tells the object map form of `commands` apart by its first
 * value naming a `source` or `content`.
 */
function isCommandMap(spec: unknown): spec is Record<string, unknown> {
  if (!isRecord(spec)) {
    return false;
  }
  const first = Object.values(spec)[0];
  return isRecord(first) && ("source" in first || "content" in first);
}

async function commandMapItem(
  root: string,
  name: string,
  entry: unknown,
  namespace: string,
): Promise<Item | null> {
  if (!isRecord(entry)) {
    return null;
  }
  const word = `/${namespace}:${name}`;
  const declared = typeof entry.description === "string" &&
      entry.description !== ""
    ? entry.description
    : null;
  if (entry.source) {
    const path = insidePlugin(root, entry.source);
    if (path == null || await pathKind(path) !== "file") {
      return null;
    }
    return declared == null
      ? commandItem(path, word)
      : { word, info: declared };
  }
  if (typeof entry.content !== "string" || entry.content === "") {
    return null;
  }
  const info = declared ?? parseFrontmatter(entry.content).description;
  return info === "" ? { word } : { word, info };
}

/**
 * A `commands` key in the manifest replaces the default `commands/` scan
 * instead of adding to it.
 */
async function pluginCommands(
  root: string,
  spec: unknown,
  namespace: string,
): Promise<Item[]> {
  if (!spec) {
    return collectCommands(join(root, "commands"), [namespace]);
  }
  if (isCommandMap(spec)) {
    const items = await Promise.all(
      Object.entries(spec).map(([name, entry]) =>
        commandMapItem(root, name, entry, namespace)
      ),
    );
    return items.filter((item): item is Item => item != null);
  }
  const groups = await Promise.all(
    declaredPaths(root, spec).map(async (path) => {
      const kind = await pathKind(path);
      if (kind === "directory") {
        return collectCommands(path, [namespace]);
      }
      if (kind === "file" && path.endsWith(".md")) {
        return [
          await commandItem(path, `/${namespace}:${basename(path, ".md")}`),
        ];
      }
      return [];
    }),
  );
  return groups.flat();
}

/**
 * Claude Code turns every character of a plugin skill's directory name
 * outside `[A-Za-z0-9_-]` into `-`.
 */
function pluginSkillWord(namespace: string): SkillWord {
  return (directoryName) =>
    `/${namespace}:${directoryName.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

/**
 * A skills location is either a directory of skill folders or one skill
 * folder holding `SKILL.md` directly, whose children are then not scanned.
 */
async function skillsAt(dir: string, word: SkillWord): Promise<Item[]> {
  const single = await skillItem(dir, word);
  return single == null ? collectSkills(dir, word) : [single];
}

/**
 * A `skills` key in the manifest adds to the default `skills/` scan.
 * Without either, a `SKILL.md` at the plugin root makes the whole plugin one
 * skill, named after the plugin directory.
 */
async function pluginSkills(
  root: string,
  spec: unknown,
  namespace: string,
): Promise<Item[]> {
  const word = pluginSkillWord(namespace);
  const defaultDir = join(root, "skills");
  const hasDefault = await pathKind(defaultDir) === "directory";
  if (!spec && !hasDefault) {
    const single = await skillItem(root, word);
    return single == null ? [] : [single];
  }
  const locations = new Set([
    ...(hasDefault ? [defaultDir] : []),
    ...(spec ? declaredPaths(root, spec) : []),
  ]);
  const groups = await Promise.all(
    [...locations].map((dir) => skillsAt(dir, word)),
  );
  return groups.flat();
}

/**
 * Collects the commands and skills one installed plugin provides.
 *
 * Words are namespaced by the `name` in `.claude-plugin/plugin.json`, or by
 * the entry name when the manifest leaves it out.
 * The manifest's `commands` and `skills` keys decide where they are read
 * from, as Claude Code's plugin manifest reference describes.
 *
 * @param installPath Absolute path to the plugin's installed copy.
 * @param id The install id, `<entry>@<marketplace>`.
 */
export async function collectPluginContents(
  installPath: string,
  id: string,
): Promise<Item[]> {
  const root = resolve(installPath);
  const manifest = await readManifest(root);
  const namespace = typeof manifest.name === "string" && manifest.name !== ""
    ? manifest.name
    : id.split("@")[0];
  const [commands, skills] = await Promise.all([
    pluginCommands(root, manifest.commands, namespace),
    pluginSkills(root, manifest.skills, namespace),
  ]);
  return [...commands, ...skills];
}
