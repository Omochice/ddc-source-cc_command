import { join } from "jsr:@std/path@1.1.6";

import { isRecord, readJson } from "./json.ts";

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
 * Resolves which plugin ids the settings files turn on.
 *
 * Settings files are applied in increasing precedence, mirroring how Claude
 * Code lets project settings override user settings.
 *
 * @param configDir Absolute path to a Claude config directory (e.g. `~/.claude`).
 * @param projectClaudeDir The nearest project `.claude` directory, or `null` outside a project.
 * @returns Ids of the form `<entry>@<marketplace>` whose resolved value is `true`.
 */
export async function resolveEnabledPlugins(
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
