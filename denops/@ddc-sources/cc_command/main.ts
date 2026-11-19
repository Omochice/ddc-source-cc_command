import type {
  Context,
  DdcOptions,
  Item,
  SourceOptions,
} from "jsr:@shougo/ddc-vim@10.3.0/types";
import { BaseSource } from "jsr:@shougo/ddc-vim@10.3.0/source";
import type { Denops } from "jsr:@denops/std@8.2.0";
import { getcwd } from "jsr:@denops/std@8.2.0/function";
import { join } from "jsr:@std/path@1.1.6/join";

import { builtins } from "./builtin.ts";
import { findSlashCommandStart } from "./complete-position.ts";
import { collectPlugins } from "./plugin.ts";
import {
  collectCommandsAndSkills,
  findProjectClaudeDir,
} from "./user-define.ts";

type Params = Record<string, never>;

/**
 * ddc.vim source that provides Claude Code slash command completion.
 *
 * Gathers built-in commands together with user-defined commands and skills
 * found under the global Claude config directory and the nearest project-local
 * `.claude` directory, plus namespaced commands and skills of enabled plugins
 * installed through Claude Code.
 */
export class Source extends BaseSource<Params> {
  #home: string;
  #configDir: string;

  constructor() {
    super();
    this.#home = Deno.env.get("HOME") ?? "";
    this.#configDir = Deno.env.get("CLAUDE_CONFIG_DIR") ||
      (this.#home ? join(this.#home, ".claude") : "");
  }

  /**
   * The default `getCompletePosition` derives the replacement range from
   * `keywordPattern`, which excludes `/`. Override here so the leading
   * slash of a slash command is part of the replacement range.
   */
  override getCompletePosition(
    { context }: { context: Context },
  ): Promise<number> {
    return Promise.resolve(findSlashCommandStart(context.input));
  }

  /**
   * Returns the full set of completion candidates for the current buffer.
   *
   * @param args.denops denops instance
   */
  override async gather({ denops }: {
    denops: Denops;
    options: DdcOptions;
    sourceOptions: SourceOptions;
    sourceParams: Params;
    completeStr: string;
  }): Promise<Item[]> {
    const projectClaudeDir = this.#home
      ? await findProjectClaudeDir(await getcwd(denops), this.#home)
      : null;
    const tasks: Promise<Item[]>[] = [];
    if (this.#configDir) {
      tasks.push(
        collectCommandsAndSkills(this.#configDir),
        collectPlugins(this.#configDir, projectClaudeDir),
      );
    }
    if (projectClaudeDir != null) {
      tasks.push(collectCommandsAndSkills(projectClaudeDir));
    }
    const results = await Promise.all(tasks);
    return [...builtins, ...results.flat()];
  }

  override params(): Params {
    return {};
  }
}
