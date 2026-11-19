import type { Item } from "jsr:@shougo/ddc-vim@10.3.0/types";
import { join } from "jsr:@std/path@1.1.6";

import { isRecord, type JsonObject, readJson } from "./json.ts";
import {
  collectCommands,
  collectSkills,
  prefixedSkillWord,
} from "./user-define.ts";

async function readManifest(installPath: string): Promise<JsonObject> {
  const manifest = await readJson(
    join(installPath, ".claude-plugin", "plugin.json"),
  );
  return isRecord(manifest) ? manifest : {};
}

/**
 * Collects the commands and skills one installed plugin provides.
 *
 * Words are namespaced by the `name` in `.claude-plugin/plugin.json`, or by
 * the entry name when the manifest leaves it out.
 *
 * @param installPath Absolute path to the plugin's installed copy.
 * @param id The install id, `<entry>@<marketplace>`.
 */
export async function collectPluginContents(
  installPath: string,
  id: string,
): Promise<Item[]> {
  const manifest = await readManifest(installPath);
  const namespace = typeof manifest.name === "string" && manifest.name !== ""
    ? manifest.name
    : id.split("@")[0];
  const [commands, skills] = await Promise.all([
    collectCommands(join(installPath, "commands"), [namespace]),
    collectSkills(join(installPath, "skills"), prefixedSkillWord([namespace])),
  ]);
  return [...commands, ...skills];
}
