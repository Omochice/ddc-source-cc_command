import type { Item } from "jsr:@shougo/ddc-vim@10.3.0/types";
import { dirname, join, resolve } from "jsr:@std/path@1.1.6";

import { resolveEnabledPlugins } from "./enabled-plugins.ts";
import { isRecord, type JsonObject, readJson } from "./json.ts";
import {
  collectCommandsAndSkills,
  findProjectClaudeDir,
} from "./user-define.ts";

/**
 * The parts of a Claude Code session that decide which plugins apply.
 */
export type PluginSession = {
  cwd: string;
  homeDir: string;
};

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
 * @param session Where the Claude Code session runs.
 * @param session.cwd The session's working directory.
 * @param session.homeDir The user's home directory, or "" when unknown.
 */
export async function collectPlugins(
  configDir: string,
  session: PluginSession,
): Promise<Item[]> {
  const projectClaudeDir = session.homeDir
    ? await findProjectClaudeDir(session.cwd, session.homeDir)
    : null;
  const [installed, enabled] = await Promise.all([
    readJson(join(configDir, "plugins", "installed_plugins.json")),
    resolveEnabledPlugins(configDir, projectClaudeDir),
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
