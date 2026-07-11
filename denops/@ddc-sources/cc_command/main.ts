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
import { collectGlobal, collectLocal } from "./user-define.ts";

type Params = Record<string, never>;

/**
 * ddc.vim source that provides Claude Code slash command completion.
 *
 * Gathers built-in commands together with user-defined commands and skills
 * found under the global Claude config directory and the nearest project-local
 * `.claude` directory.
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
    const tasks: Promise<Item[]>[] = [];
    if (this.#configDir) {
      tasks.push(collectGlobal(this.#configDir));
    }
    if (this.#home) {
      tasks.push(collectLocal(await getcwd(denops), this.#home));
    }
    const results = await Promise.all(tasks);
    return [...builtins, ...results.flat()];
  }

  override params(): Params {
    return {};
  }
}
