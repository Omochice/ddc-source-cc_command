import { join } from "jsr:@std/path@1.1.6";

import { canonicalPath, findGitRoot } from "./git-root.ts";
import { isRecord, readJson } from "./json.ts";
import type { Session } from "./session.ts";

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
 * Claude Code keeps `settings.local.json` at the repository root so that a
 * standing approval covers the whole repository.
 * It leaves the file beside `settings.json` outside a repository, on Windows,
 * and when the root is the home directory, whose `.claude` is the user's own
 * config.
 * A file that versions before 2.1.211 left in the working directory is still
 * read, below the root's.
 */
async function localSettingsPaths(session: Session): Promise<string[]> {
  const atCwd = join(session.cwd, ".claude", "settings.local.json");
  if (Deno.build.os === "windows") {
    return [atCwd];
  }
  const root = await findGitRoot(session.cwd);
  if (
    root == null ||
    (session.homeDir !== "" && root === await canonicalPath(session.homeDir))
  ) {
    return [atCwd];
  }
  const atRoot = join(root, ".claude", "settings.local.json");
  if (root === await canonicalPath(session.cwd)) {
    return [atRoot];
  }
  return [atCwd, atRoot];
}

/**
 * Resolves which plugin ids the settings files turn on.
 *
 * Reads `enabledPlugins` from the user settings, the shared project settings
 * in the session's working directory, and the local project settings, in
 * increasing precedence.
 * Each id takes its value from the highest file that mentions it.
 *
 * @param configDir Absolute path to a Claude config directory (e.g. `~/.claude`).
 * @param session Where the Claude Code session runs.
 * @returns Ids of the form `<entry>@<marketplace>` whose resolved value is `true`.
 */
export async function resolveEnabledPlugins(
  configDir: string,
  session: Session,
): Promise<Set<string>> {
  const paths = [
    join(configDir, "settings.json"),
    join(session.cwd, ".claude", "settings.json"),
    ...await localSettingsPaths(session),
  ];
  const layers = await Promise.all(paths.map(readEnabledPlugins));
  const merged = Object.assign({}, ...layers) as Record<string, boolean>;
  return new Set(
    Object.entries(merged).filter(([, on]) => on).map(([key]) => key),
  );
}
