import type {
  DdcOptions,
  Item,
  SourceOptions,
} from "jsr:@shougo/ddc-vim@10.3.0/types";
import { BaseSource } from "jsr:@shougo/ddc-vim@10.3.0/source";
import type { Denops } from "jsr:@denops/std@8.2.0";
import { getcwd } from "jsr:@denops/std@8.2.0/function";
import { join } from "jsr:@std/path@1.1.4/join";

import { builtins } from "./builtin.ts";
import { collectGlobal, collectLocal } from "./user-define.ts";

type Params = Record<string, unknown>;

export class Source extends BaseSource<Params> {
  override async gather(args: {
    denops: Denops;
    options: DdcOptions;
    sourceOptions: SourceOptions;
    sourceParams: Params;
    completeStr: string;
  }): Promise<Item[]> {
    const home = Deno.env.get("HOME") ?? "";
    const configDir = Deno.env.get("CLAUDE_CONFIG_DIR") ??
      join(home, ".claude");
    const [global, local] = await Promise.all([
      collectGlobal(configDir),
      collectLocal(await getcwd(args.denops), home),
    ]);
    return [...builtins, ...global, ...local];
  }

  override params(): Params {
    return {};
  }
}
