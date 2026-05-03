import { assertEquals } from "jsr:@std/assert@1";
import { join } from "jsr:@std/path@1";
import { collectGlobal } from "./user-define.ts";

Deno.test("collectGlobal returns [] when configDir does not exist", async () => {
  const tmp = await Deno.makeTempDir();
  try {
    const missing = join(tmp, "does-not-exist");
    const items = await collectGlobal(missing);
    assertEquals(items, []);
  } finally {
    await Deno.remove(tmp, { recursive: true });
  }
});
