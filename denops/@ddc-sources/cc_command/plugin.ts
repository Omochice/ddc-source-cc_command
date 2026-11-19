import type { Item } from "jsr:@shougo/ddc-vim@10.3.0/types";
import { join } from "jsr:@std/path@1.1.6";

import { resolveEnabledPlugins } from "./enabled-plugins.ts";
import { canonicalPath, findGitRoot } from "./git-root.ts";
import { isRecord, type JsonObject, readJson } from "./json.ts";
import type { Session } from "./session.ts";
import { collectPluginContents } from "./plugin-contents.ts";

/**
 * User and managed scope installs apply everywhere.
 * Project and local scope installs are tied to one project, which Claude Code
 * takes to be the whole git repository it belongs to, so they must not leak
 * into completions for other projects.
 */
async function appliesToSession(
  entry: JsonObject,
  where: { cwd: string; gitRoot: string | null },
): Promise<boolean> {
  if (entry.scope === "user" || entry.scope === "managed") {
    return true;
  }
  if (typeof entry.projectPath !== "string") {
    return false;
  }
  if (await canonicalPath(entry.projectPath) === where.cwd) {
    return true;
  }
  return where.gitRoot != null &&
    await findGitRoot(entry.projectPath) === where.gitRoot;
}

/**
 * Collects namespaced commands and skills of enabled Claude Code plugins.
 *
 * Reads `<configDir>/plugins/installed_plugins.json` and keeps only the
 * plugins that the settings files enable through `enabledPlugins`.
 * Words take the form `/<plugin>:<command>` or `/<plugin>:<skill>`.
 * Missing or malformed files are skipped rather than reported.
 *
 * @param configDir Absolute path to a Claude config directory (e.g. `~/.claude`).
 * @param session Where the Claude Code session runs.
 */
export async function collectPlugins(
  configDir: string,
  session: Session,
): Promise<Item[]> {
  const [installed, enabled, cwd, gitRoot] = await Promise.all([
    readJson(join(configDir, "plugins", "installed_plugins.json")),
    resolveEnabledPlugins(configDir, session),
    canonicalPath(session.cwd),
    findGitRoot(session.cwd),
  ]);
  if (!isRecord(installed) || !isRecord(installed.plugins)) {
    return [];
  }
  const candidates = Object.entries(installed.plugins).flatMap(
    ([key, entries]) =>
      enabled.has(key) && Array.isArray(entries)
        ? entries.filter(isRecord).map((entry) => ({ key, entry }))
        : [],
  );
  const applicable = await Promise.all(
    candidates.map(({ entry }) => appliesToSession(entry, { cwd, gitRoot })),
  );
  const installPaths = new Map<string, string>();
  candidates.forEach(({ key, entry }, i) => {
    if (applicable[i] && typeof entry.installPath === "string") {
      installPaths.set(entry.installPath, key);
    }
  });
  const groups = await Promise.all(
    [...installPaths].map(([installPath, key]) =>
      collectPluginContents(installPath, key)
    ),
  );
  return groups.flat();
}
