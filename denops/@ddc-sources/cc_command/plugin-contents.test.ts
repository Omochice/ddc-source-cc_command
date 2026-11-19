import { describe, it } from "jsr:@std/testing@1/bdd";
import { expect } from "jsr:@std/expect@1";
import { dirname, join } from "jsr:@std/path@1";
import type { Item } from "jsr:@shougo/ddc-vim@10.3.0/types";
import { collectPluginContents } from "./plugin-contents.ts";

async function withPlugin(
  fn: (root: string) => Promise<void>,
): Promise<void> {
  const tmp = await Deno.makeTempDir();
  try {
    const root = join(tmp, "cache", "mkt", "tools", "1.2.0");
    await Deno.mkdir(root, { recursive: true });
    await fn(root);
  } finally {
    await Deno.remove(tmp, { recursive: true });
  }
}

async function write(path: string, text = ""): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, text);
}

function described(description: string): string {
  return `---\ndescription: ${description}\n---\n`;
}

async function writeManifest(root: string, manifest: unknown): Promise<void> {
  await write(
    join(root, ".claude-plugin", "plugin.json"),
    JSON.stringify(manifest),
  );
}

function sorted(items: Item[]): Item[] {
  return [...items].sort((a, b) => a.word.localeCompare(b.word));
}

async function wordsOf(root: string): Promise<string[]> {
  return (await collectPluginContents(root, "tools@mkt"))
    .map((item) => item.word).sort();
}

describe("collectPluginContents", () => {
  describe("namespace", () => {
    it("falls back to the entry name without a manifest name", async () => {
      await withPlugin(async (root) => {
        await write(join(root, "commands", "hello.md"));
        expect(await wordsOf(root)).toEqual(["/tools:hello"]);
      });
    });

    it("uses the manifest name", async () => {
      await withPlugin(async (root) => {
        await writeManifest(root, { name: "renamed" });
        await write(join(root, "commands", "hello.md"));
        expect(await wordsOf(root)).toEqual(["/renamed:hello"]);
      });
    });
  });

  describe("manifest commands", () => {
    it("replaces the default commands directory with a declared one", async () => {
      await withPlugin(async (root) => {
        await writeManifest(root, { commands: "./custom" });
        await write(join(root, "commands", "default.md"));
        await write(join(root, "custom", "deploy.md"));
        await write(join(root, "custom", "team", "ship.md"));
        expect(await wordsOf(root)).toEqual([
          "/tools:deploy",
          "/tools:team:ship",
        ]);
      });
    });

    it("accepts a list of command files and directories", async () => {
      await withPlugin(async (root) => {
        await writeManifest(root, {
          commands: ["./one.md", "./more/", "./notes.txt"],
        });
        await write(join(root, "one.md"), described("first"));
        await write(join(root, "more", "two.md"));
        await write(join(root, "notes.txt"));
        const items = await collectPluginContents(root, "tools@mkt");
        expect(sorted(items)).toEqual([
          { word: "/tools:one", info: "first" },
          { word: "/tools:two" },
        ]);
      });
    });

    it("names commands of an object map after their keys", async () => {
      await withPlugin(async (root) => {
        await writeManifest(root, {
          commands: {
            status: { source: "./commands/status.md" },
            about: { content: `${described("inline")}Explain this plugin.` },
            summary: {
              source: "./commands/status.md",
              description: "from the manifest",
            },
            bare: { content: "No frontmatter." },
          },
        });
        await write(join(root, "commands", "status.md"), described("on file"));
        await write(join(root, "commands", "unlisted.md"));
        const items = await collectPluginContents(root, "tools@mkt");
        expect(sorted(items)).toEqual([
          { word: "/tools:about", info: "inline" },
          { word: "/tools:bare" },
          { word: "/tools:status", info: "on file" },
          { word: "/tools:summary", info: "from the manifest" },
        ]);
      });
    });

    it("skips object map entries whose source is missing", async () => {
      await withPlugin(async (root) => {
        await writeManifest(root, {
          commands: { gone: { source: "./missing.md" } },
        });
        expect(await wordsOf(root)).toEqual([]);
      });
    });

    it("ignores paths that escape the plugin directory", async () => {
      await withPlugin(async (root) => {
        await writeManifest(root, {
          commands: ["../outside.md", "./inside.md"],
        });
        await write(join(root, "..", "outside.md"));
        await write(join(root, "inside.md"));
        expect(await wordsOf(root)).toEqual(["/tools:inside"]);
      });
    });
  });

  describe("manifest skills", () => {
    it("adds declared skill directories to the default one", async () => {
      await withPlugin(async (root) => {
        await writeManifest(root, { skills: ["./extra", "./skills/"] });
        await write(join(root, "skills", "lint", "SKILL.md"));
        await write(join(root, "extra", "format", "SKILL.md"));
        expect(await wordsOf(root)).toEqual(["/tools:format", "/tools:lint"]);
      });
    });

    it("loads a declared folder holding SKILL.md as one skill", async () => {
      await withPlugin(async (root) => {
        await writeManifest(root, { skills: "./review" });
        await write(join(root, "review", "SKILL.md"), described("review it"));
        await write(join(root, "review", "nested", "SKILL.md"));
        const items = await collectPluginContents(root, "tools@mkt");
        expect(items).toEqual([{ word: "/tools:review", info: "review it" }]);
      });
    });

    it("ignores skill paths that escape the plugin directory", async () => {
      await withPlugin(async (root) => {
        await writeManifest(root, { skills: "../elsewhere" });
        await write(join(root, "..", "elsewhere", "x", "SKILL.md"));
        expect(await wordsOf(root)).toEqual([]);
      });
    });

    it("replaces characters Claude Code does not keep in skill names", async () => {
      await withPlugin(async (root) => {
        await write(join(root, "skills", "foo.bar baz", "SKILL.md"));
        expect(await wordsOf(root)).toEqual(["/tools:foo-bar-baz"]);
      });
    });
  });

  describe("SKILL.md at the plugin root", () => {
    it("loads as one skill named after the plugin directory", async () => {
      await withPlugin(async (root) => {
        await write(join(root, "SKILL.md"), described("whole plugin"));
        await write(join(root, "nested", "SKILL.md"));
        const items = await collectPluginContents(root, "tools@mkt");
        expect(items).toEqual([{ word: "/tools:1-2-0", info: "whole plugin" }]);
      });
    });

    it("is ignored when a skills directory exists", async () => {
      await withPlugin(async (root) => {
        await write(join(root, "SKILL.md"));
        await write(join(root, "skills", "lint", "SKILL.md"));
        expect(await wordsOf(root)).toEqual(["/tools:lint"]);
      });
    });

    it("is ignored when the manifest declares skills", async () => {
      await withPlugin(async (root) => {
        await writeManifest(root, { skills: "./extra" });
        await write(join(root, "SKILL.md"));
        await write(join(root, "extra", "format", "SKILL.md"));
        expect(await wordsOf(root)).toEqual(["/tools:format"]);
      });
    });

    it("loads when the manifest declares the plugin root", async () => {
      await withPlugin(async (root) => {
        await writeManifest(root, { skills: "." });
        await write(join(root, "SKILL.md"));
        await write(join(root, "skills", "lint", "SKILL.md"));
        expect(await wordsOf(root)).toEqual(["/tools:1-2-0", "/tools:lint"]);
      });
    });
  });
});
