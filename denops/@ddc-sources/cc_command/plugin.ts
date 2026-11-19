import type { Item } from "jsr:@shougo/ddc-vim@10.3.0/types";
import { dirname, join, resolve } from "jsr:@std/path@1.1.6";

import { collectCommandsAndSkills } from "./user-define.ts";

type JsonObject = Record<string, unknown>;

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await Deno.readTextFile(path));
  } catch {
    return undefined;
  }
}

async function readEnabledPlugins(
  settingsPath: string,
): Promise<Record<string, boolean>> {
  const settings = await readJson(settingsPath);
  if (!isRecord(settings) || !isRecord(settings.enabledPlugins)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(settings.enabledPlugins).filter(
      (entry): entry is [string, boolean] => typeof entry[1] === "boolean",
    ),
  );
}

/**
 * Settings files are applied in increasing precedence, mirroring how Claude
 * Code lets project settings override user settings.
 */
async function resolveEnabled(
  configDir: string,
  projectClaudeDir: string | null,
): Promise<Set<string>> {
  const paths = [join(configDir, "settings.json")];
  if (projectClaudeDir != null) {
    paths.push(
      join(projectClaudeDir, "settings.json"),
      join(projectClaudeDir, "settings.local.json"),
    );
  }
  const layers = await Promise.all(paths.map(readEnabledPlugins));
  const merged = Object.assign({}, ...layers) as Record<string, boolean>;
  return new Set(
    Object.entries(merged).filter(([, on]) => on).map(([key]) => key),
  );
}

async function resolvePluginName(
  installPath: string,
  key: string,
): Promise<string> {
  const manifest = await readJson(
    join(installPath, ".claude-plugin", "plugin.json"),
  );
  if (
    isRecord(manifest) && typeof manifest.name === "string" &&
    manifest.name !== ""
  ) {
    return manifest.name;
  }
  return key.split("@")[0];
}

/**
 * User-scope installs apply everywhere.
 * Project and local scope installs are tied to one project, so they must not
 * leak into completions for other projects.
 */
function appliesToProject(
  entry: JsonObject,
  projectClaudeDir: string | null,
): boolean {
  if (entry.scope === "user") {
    return true;
  }
  if (
    projectClaudeDir == null || typeof entry.projectPath !== "string"
  ) {
    return false;
  }
  return resolve(entry.projectPath) === resolve(dirname(projectClaudeDir));
}

/**
 * Collects namespaced commands and skills of enabled Claude Code plugins.
 *
 * Reads `<configDir>/plugins/installed_plugins.json` and keeps only the
 * plugins enabled through `enabledPlugins` in the user settings and, when a
 * project is given, the project's `settings.json` and `settings.local.json`.
 * Words take the form `/<plugin>:<command>` or `/<plugin>:<skill>`.
 * Missing or malformed files are skipped rather than reported.
 *
 * @param configDir Absolute path to a Claude config directory (e.g. `~/.claude`).
 * @param projectClaudeDir The nearest project `.claude` directory, or `null` outside a project.
 */
export async function collectPlugins(
  configDir: string,
  projectClaudeDir: string | null,
): Promise<Item[]> {
  const [installed, enabled] = await Promise.all([
    readJson(join(configDir, "plugins", "installed_plugins.json")),
    resolveEnabled(configDir, projectClaudeDir),
  ]);
  if (!isRecord(installed) || !isRecord(installed.plugins)) {
    return [];
  }
  const installPaths = new Map<string, string>();
  for (const [key, entries] of Object.entries(installed.plugins)) {
    if (!enabled.has(key) || !Array.isArray(entries)) {
      continue;
    }
    for (const entry of entries) {
      if (
        isRecord(entry) && typeof entry.installPath === "string" &&
        appliesToProject(entry, projectClaudeDir)
      ) {
        installPaths.set(entry.installPath, key);
      }
    }
  }
  const groups = await Promise.all(
    [...installPaths].map(async ([installPath, key]) =>
      collectCommandsAndSkills(
        installPath,
        await resolvePluginName(installPath, key),
      )
    ),
  );
  return groups.flat();
}
