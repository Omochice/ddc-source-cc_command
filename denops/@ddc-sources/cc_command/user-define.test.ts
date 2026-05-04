import { describe, it } from "jsr:@std/testing@1/bdd";
import { expect } from "jsr:@std/expect@1";
import { join } from "jsr:@std/path@1";
import { collectGlobal, collectLocal } from "./user-define.ts";

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

async function captureWarnings<T>(fn: () => Promise<T>): Promise<{
  result: T;
  warnings: unknown[][];
}> {
  const warnings: unknown[][] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => warnings.push(args);
  try {
    const result = await fn();
    return { result, warnings };
  } finally {
    console.warn = original;
  }
}

async function writeCommand(
  dotClaude: string,
  name: string,
  description: string,
): Promise<void> {
  const cmds = join(dotClaude, "commands");
  await Deno.mkdir(cmds, { recursive: true });
  await Deno.writeTextFile(
    join(cmds, `${name}.md`),
    `---\ndescription: ${description}\n---\n`,
  );
}

describe("collectGlobal", () => {
  describe("basics", () => {
    it("returns [] when configDir does not exist", async () => {
      await withTempConfigDir(async (tmp) => {
        const missing = join(tmp, "does-not-exist");
        const items = await collectGlobal(missing);
        expect(items).toEqual([]);
      });
    });

    it("returns [] when configDir has no skills/ or commands/", async () => {
      await withTempConfigDir(async (configDir) => {
        const items = await collectGlobal(configDir);
        expect(items).toEqual([]);
      });
    });

    it("reads a command file as a slash item", async () => {
      await withTempConfigDir(async (configDir) => {
        const commandsDir = join(configDir, "commands");
        await Deno.mkdir(commandsDir, { recursive: true });
        await Deno.writeTextFile(
          join(commandsDir, "foo.md"),
          "---\ndescription: Do the foo thing\n---\nbody\n",
        );

        const items = await collectGlobal(configDir);

        expect(items).toEqual([{ word: "/foo", info: "Do the foo thing" }]);
      });
    });

    it("reads a skill SKILL.md and tags it as (skill)", async () => {
      await withTempConfigDir(async (configDir) => {
        const skillDir = join(configDir, "skills", "foo");
        await Deno.mkdir(skillDir, { recursive: true });
        await Deno.writeTextFile(
          join(skillDir, "SKILL.md"),
          "---\nname: foo\ndescription: Do the foo skill\n---\nbody\n",
        );

        const items = await collectGlobal(configDir);

        expect(items).toEqual([
          { word: "/foo", info: "Do the foo skill (skill)" },
        ]);
      });
    });

    it("uses the skill directory name, not the frontmatter name", async () => {
      await withTempConfigDir(async (configDir) => {
        const skillDir = join(configDir, "skills", "actual-dir");
        await Deno.mkdir(skillDir, { recursive: true });
        await Deno.writeTextFile(
          join(skillDir, "SKILL.md"),
          "---\nname: misleading-name\ndescription: d\n---\n",
        );

        const items = await collectGlobal(configDir);

        expect(items).toEqual([{ word: "/actual-dir", info: "d (skill)" }]);
      });
    });

    it("returns both skills and commands together", async () => {
      await withTempConfigDir(async (configDir) => {
        const cmds = join(configDir, "commands");
        const sk = join(configDir, "skills", "bar");
        await Deno.mkdir(cmds, { recursive: true });
        await Deno.mkdir(sk, { recursive: true });
        await Deno.writeTextFile(
          join(cmds, "foo.md"),
          "---\ndescription: c\n---\n",
        );
        await Deno.writeTextFile(
          join(sk, "SKILL.md"),
          "---\ndescription: s\n---\n",
        );

        const items = await collectGlobal(configDir);

        const sorted = [...items].sort((a, b) => a.word.localeCompare(b.word));
        expect(sorted).toEqual([
          { word: "/bar", info: "s (skill)" },
          { word: "/foo", info: "c" },
        ]);
      });
    });
  });

  describe("missing or empty frontmatter", () => {
    it("yields word-only item when command has no frontmatter", async () => {
      await withTempConfigDir(async (configDir) => {
        const dir = join(configDir, "commands");
        await Deno.mkdir(dir, { recursive: true });
        await Deno.writeTextFile(
          join(dir, "foo.md"),
          "just a body, no frontmatter",
        );

        const items = await collectGlobal(configDir);

        expect(items).toEqual([{ word: "/foo", info: "" }]);
      });
    });

    it("yields word-only item when skill has no frontmatter", async () => {
      await withTempConfigDir(async (configDir) => {
        const dir = join(configDir, "skills", "foo");
        await Deno.mkdir(dir, { recursive: true });
        await Deno.writeTextFile(
          join(dir, "SKILL.md"),
          "just a body, no frontmatter",
        );

        const items = await collectGlobal(configDir);

        expect(items).toEqual([{ word: "/foo", info: "" }]);
      });
    });

    it("yields empty info when frontmatter has no description", async () => {
      await withTempConfigDir(async (configDir) => {
        const dir = join(configDir, "commands");
        await Deno.mkdir(dir, { recursive: true });
        await Deno.writeTextFile(join(dir, "foo.md"), "---\nname: foo\n---\n");

        const items = await collectGlobal(configDir);

        expect(items).toEqual([{ word: "/foo", info: "" }]);
      });
    });
  });

  describe("nested commands", () => {
    it("joins one level of nesting with a colon", async () => {
      await withTempConfigDir(async (configDir) => {
        const nested = join(configDir, "commands", "team");
        await Deno.mkdir(nested, { recursive: true });
        await Deno.writeTextFile(
          join(nested, "deploy.md"),
          "---\ndescription: Deploy the team service\n---\n",
        );

        const items = await collectGlobal(configDir);

        expect(items).toEqual([
          { word: "/team:deploy", info: "Deploy the team service" },
        ]);
      });
    });

    it("joins multi-level nested commands with colons", async () => {
      await withTempConfigDir(async (configDir) => {
        const nested = join(configDir, "commands", "a", "b");
        await Deno.mkdir(nested, { recursive: true });
        await Deno.writeTextFile(
          join(nested, "c.md"),
          "---\ndescription: deep\n---\n",
        );

        const items = await collectGlobal(configDir);

        expect(items).toEqual([{ word: "/a:b:c", info: "deep" }]);
      });
    });

    it("ignores skill directories without SKILL.md", async () => {
      await withTempConfigDir(async (configDir) => {
        const empty = join(configDir, "skills", "templates");
        await Deno.mkdir(empty, { recursive: true });
        await Deno.writeTextFile(
          join(empty, "notes.md"),
          "helper file, not a skill",
        );

        const real = join(configDir, "skills", "real");
        await Deno.mkdir(real, { recursive: true });
        await Deno.writeTextFile(
          join(real, "SKILL.md"),
          "---\ndescription: real skill\n---\n",
        );

        const items = await collectGlobal(configDir);

        expect(items).toEqual([
          { word: "/real", info: "real skill (skill)" },
        ]);
      });
    });

    it("does not treat skill subdirectories as separate skills", async () => {
      await withTempConfigDir(async (configDir) => {
        const skillDir = join(configDir, "skills", "foo");
        await Deno.mkdir(join(skillDir, "references"), { recursive: true });
        await Deno.writeTextFile(
          join(skillDir, "SKILL.md"),
          "---\ndescription: d\n---\n",
        );
        await Deno.writeTextFile(
          join(skillDir, "references", "notes.md"),
          "internal notes",
        );

        const items = await collectGlobal(configDir);

        expect(items).toEqual([{ word: "/foo", info: "d (skill)" }]);
      });
    });
  });

  describe("error handling", () => {
    it("warns and yields word-only item for malformed YAML in a command", async () => {
      await withTempConfigDir(async (configDir) => {
        const dir = join(configDir, "commands");
        await Deno.mkdir(dir, { recursive: true });
        await Deno.writeTextFile(
          join(dir, "foo.md"),
          "---\ndescription: : : :\n  not: valid\n---\n",
        );

        const { result, warnings } = await captureWarnings(() =>
          collectGlobal(configDir)
        );

        expect(result).toEqual([{ word: "/foo", info: "" }]);
        expect(warnings.length).toBeGreaterThan(0);
      });
    });

    it("skips dotfiles and dotdirs", async () => {
      await withTempConfigDir(async (configDir) => {
        const cmds = join(configDir, "commands");
        await Deno.mkdir(join(cmds, ".hidden"), { recursive: true });
        await Deno.writeTextFile(
          join(cmds, ".hidden", "secret.md"),
          "---\ndescription: x\n---\n",
        );
        await Deno.writeTextFile(join(cmds, ".DS_Store"), "noise");
        await Deno.writeTextFile(
          join(cmds, ".dotfile.md"),
          "---\ndescription: x\n---\n",
        );
        await Deno.writeTextFile(
          join(cmds, "visible.md"),
          "---\ndescription: v\n---\n",
        );

        const skills = join(configDir, "skills");
        await Deno.mkdir(join(skills, ".hidden-skill"), { recursive: true });
        await Deno.writeTextFile(
          join(skills, ".hidden-skill", "SKILL.md"),
          "---\ndescription: hidden\n---\n",
        );

        const items = await collectGlobal(configDir);

        expect(items).toEqual([{ word: "/visible", info: "v" }]);
      });
    });

    it("skips broken symlinks without throwing", async () => {
      await withTempConfigDir(async (configDir) => {
        const cmds = join(configDir, "commands");
        await Deno.mkdir(cmds, { recursive: true });
        await Deno.symlink(
          join(configDir, "missing-target.md"),
          join(cmds, "broken.md"),
        );
        await Deno.writeTextFile(
          join(cmds, "ok.md"),
          "---\ndescription: ok\n---\n",
        );

        const items = await collectGlobal(configDir);

        expect(items).toEqual([{ word: "/ok", info: "ok" }]);
      });
    });

    it("keeps going when a subdirectory is unreadable", async () => {
      await withTempConfigDir(async (configDir) => {
        const cmds = join(configDir, "commands");
        const blocked = join(cmds, "blocked");
        await Deno.mkdir(blocked, { recursive: true });
        await Deno.writeTextFile(
          join(blocked, "secret.md"),
          "---\ndescription: secret\n---\n",
        );
        await Deno.chmod(blocked, 0o000);
        await Deno.writeTextFile(
          join(cmds, "ok.md"),
          "---\ndescription: ok\n---\n",
        );

        try {
          const items = await collectGlobal(configDir);
          expect(items).toEqual([{ word: "/ok", info: "ok" }]);
        } finally {
          await Deno.chmod(blocked, 0o755);
        }
      });
    });

    it("keeps going when a single file is unreadable", async () => {
      await withTempConfigDir(async (configDir) => {
        const cmds = join(configDir, "commands");
        await Deno.mkdir(cmds, { recursive: true });
        const blocked = join(cmds, "blocked.md");
        await Deno.writeTextFile(
          blocked,
          "---\ndescription: secret\n---\n",
        );
        await Deno.chmod(blocked, 0o000);
        await Deno.writeTextFile(
          join(cmds, "ok.md"),
          "---\ndescription: ok\n---\n",
        );

        try {
          const { result } = await captureWarnings(() =>
            collectGlobal(configDir)
          );
          const sorted = [...result].sort((a, b) =>
            a.word.localeCompare(b.word)
          );
          expect(sorted).toEqual([
            { word: "/blocked", info: "" },
            { word: "/ok", info: "ok" },
          ]);
        } finally {
          await Deno.chmod(blocked, 0o644);
        }
      });
    });
  });

  describe("symlinks", () => {
    it("follows valid symlinks to command files", async () => {
      await withTempConfigDir(async (configDir) => {
        const cmds = join(configDir, "commands");
        await Deno.mkdir(cmds, { recursive: true });
        const target = join(configDir, "elsewhere", "real.md");
        await Deno.mkdir(join(configDir, "elsewhere"), { recursive: true });
        await Deno.writeTextFile(
          target,
          "---\ndescription: linked\n---\n",
        );
        await Deno.symlink(target, join(cmds, "linked.md"));

        const items = await collectGlobal(configDir);

        expect(items).toEqual([{ word: "/linked", info: "linked" }]);
      });
    });

    it("follows valid symlinks to skill directories", async () => {
      await withTempConfigDir(async (configDir) => {
        const skills = join(configDir, "skills");
        await Deno.mkdir(skills, { recursive: true });
        const target = join(configDir, "elsewhere", "actual-skill");
        await Deno.mkdir(target, { recursive: true });
        await Deno.writeTextFile(
          join(target, "SKILL.md"),
          "---\ndescription: linked skill\n---\n",
        );
        await Deno.symlink(target, join(skills, "linked-skill"));

        const items = await collectGlobal(configDir);

        expect(items).toEqual([
          { word: "/linked-skill", info: "linked skill (skill)" },
        ]);
      });
    });
  });
});

describe("collectLocal", () => {
  it("returns [] when no ancestor has .claude", async () => {
    const home = await Deno.makeTempDir();
    const root = await Deno.makeTempDir();
    try {
      const start = join(root, "a", "b", "c");
      await Deno.mkdir(start, { recursive: true });

      const items = await collectLocal(start, home);

      expect(items).toEqual([]);
    } finally {
      await Deno.remove(home, { recursive: true });
      await Deno.remove(root, { recursive: true });
    }
  });

  it("reads .claude at startDir", async () => {
    const home = await Deno.makeTempDir();
    const root = await Deno.makeTempDir();
    try {
      await writeCommand(join(root, ".claude"), "foo", "local foo");

      const items = await collectLocal(root, home);

      expect(items).toEqual([{ word: "/foo", info: "local foo" }]);
    } finally {
      await Deno.remove(home, { recursive: true });
      await Deno.remove(root, { recursive: true });
    }
  });

  it("walks up to find an ancestor .claude", async () => {
    const home = await Deno.makeTempDir();
    const root = await Deno.makeTempDir();
    try {
      await writeCommand(join(root, ".claude"), "foo", "ancestor foo");
      const start = join(root, "a", "b");
      await Deno.mkdir(start, { recursive: true });

      const items = await collectLocal(start, home);

      expect(items).toEqual([{ word: "/foo", info: "ancestor foo" }]);
    } finally {
      await Deno.remove(home, { recursive: true });
      await Deno.remove(root, { recursive: true });
    }
  });

  it("does not look inside or above homeDir", async () => {
    const home = await Deno.makeTempDir();
    const root = join(home, "project", "sub");
    try {
      await writeCommand(join(home, ".claude"), "global-only", "g");
      await Deno.mkdir(root, { recursive: true });

      const items = await collectLocal(root, home);

      expect(items).toEqual([]);
    } finally {
      await Deno.remove(home, { recursive: true });
    }
  });

  it("uses the nearest .claude when multiple ancestors have one", async () => {
    const home = await Deno.makeTempDir();
    const root = await Deno.makeTempDir();
    try {
      await writeCommand(join(root, ".claude"), "outer", "outer");
      await writeCommand(join(root, "inner", ".claude"), "inner", "inner");
      const start = join(root, "inner", "deeper");
      await Deno.mkdir(start, { recursive: true });

      const items = await collectLocal(start, home);

      expect(items).toEqual([{ word: "/inner", info: "inner" }]);
    } finally {
      await Deno.remove(home, { recursive: true });
      await Deno.remove(root, { recursive: true });
    }
  });
});
