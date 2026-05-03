import type {
  DdcOptions,
  Item,
  SourceOptions,
} from "jsr:@shougo/ddc-vim@10.3.0/types";
import { BaseSource } from "jsr:@shougo/ddc-vim@10.3.0/source";
import type { Denops } from "jsr:@denops/std@8.2.0";

import { builtins } from "./builtin.ts";

type Params = Record<string, unknown>;

export class Source extends BaseSource<Params> {
  override gather(_: {
    denops: Denops;
    options: DdcOptions;
    sourceOptions: SourceOptions;
    sourceParams: Params;
    completeStr: string;
  }): Promise<Item[]> {
    return Promise.resolve(builtins);
  }

  override params(): Params {
    return {};
  }
}
