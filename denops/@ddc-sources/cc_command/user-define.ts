import type { Item } from "jsr:@shougo/ddc-vim@10.3.0/types";

export function collectGlobal(_configDir: string): Promise<Item[]> {
  throw new Error("not implemented");
}

export function collectLocal(
  _startDir: string,
  _homeDir: string,
): Promise<Item[]> {
  throw new Error("not implemented");
}
