import { assertEquals } from "jsr:@std/assert@1";
import { join } from "jsr:@std/path@1";
import { collectGlobal } from "./user-define.ts";

async function withTempConfigDir(
  fn: (configDir: string) => Promise<void>,
): Promise<void> {
  const configDir = await Deno.makeTempDir();
  try {
    await fn(configDir);
  } finally {
    await Deno.remove(configDir, { recursive: true });
  }
}

Deno.test("collectGlobal returns [] when configDir does not exist", async () => {
  await withTempConfigDir(async (tmp) => {
    const missing = join(tmp, "does-not-exist");
    const items = await collectGlobal(missing);
    assertEquals(items, []);
  });
});

Deno.test("collectGlobal reads a command file as a slash item", async () => {
  await withTempConfigDir(async (configDir) => {
    const commandsDir = join(configDir, "commands");
    await Deno.mkdir(commandsDir, { recursive: true });
    await Deno.writeTextFile(
      join(commandsDir, "foo.md"),
      "---\ndescription: Do the foo thing\n---\nbody\n",
    );

    const items = await collectGlobal(configDir);

    assertEquals(items, [{ word: "/foo", info: "Do the foo thing" }]);
  });
});
