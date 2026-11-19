import { describe, it } from "jsr:@std/testing@1/bdd";
import { expect } from "jsr:@std/expect@1";
import { join } from "jsr:@std/path@1";
import { resolveEnabledPlugins } from "./enabled-plugins.ts";

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir();
  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await Deno.mkdir(join(path, ".."), { recursive: true });
  await Deno.writeTextFile(path, JSON.stringify(value));
}

function enabling(...ids: string[]): unknown {
  return { enabledPlugins: Object.fromEntries(ids.map((id) => [id, true])) };
}

async function enabledIn(
  configDir: string,
  cwd: string,
  homeDir = "",
  managedSettingsDir: string | null = null,
): Promise<string[]> {
  const enabled = await resolveEnabledPlugins(configDir, {
    cwd,
    homeDir,
    managedSettingsDir,
  });
  return [...enabled].sort();
}

describe("resolveEnabledPlugins", () => {
  it("keeps only ids whose value is true", async () => {
    await withTempDir(async (tmp) => {
      await writeJson(join(tmp, "config", "settings.json"), {
        enabledPlugins: { "on@m": true, "off@m": false, "odd@m": "yes" },
      });
      expect(await enabledIn(join(tmp, "config"), tmp)).toEqual(["on@m"]);
    });
  });

  it("applies user, project and local settings in increasing precedence", async () => {
    await withTempDir(async (tmp) => {
      const configDir = join(tmp, "config");
      const project = join(tmp, "project");
      await writeJson(join(configDir, "settings.json"), {
        enabledPlugins: { "a@m": true, "b@m": true, "c@m": true },
      });
      await writeJson(join(project, ".claude", "settings.json"), {
        enabledPlugins: { "a@m": false, "b@m": false },
      });
      await writeJson(join(project, ".claude", "settings.local.json"), {
        enabledPlugins: { "b@m": true },
      });
      expect(await enabledIn(configDir, project)).toEqual(["b@m", "c@m"]);
    });
  });

  describe("project settings.json", () => {
    it("is not read from a parent of the working directory", async () => {
      await withTempDir(async (tmp) => {
        const project = join(tmp, "project");
        await writeJson(
          join(project, ".claude", "settings.json"),
          enabling("p@m"),
        );
        await Deno.mkdir(join(project, "sub"), { recursive: true });
        expect(await enabledIn(join(tmp, "config"), join(project, "sub")))
          .toEqual([]);
      });
    });

    it("is not read from the repository root below the working directory", async () => {
      await withTempDir(async (tmp) => {
        const repo = join(tmp, "repo");
        await Deno.mkdir(join(repo, ".git"), { recursive: true });
        await writeJson(
          join(repo, ".claude", "settings.json"),
          enabling("p@m"),
        );
        await Deno.mkdir(join(repo, "sub"), { recursive: true });
        expect(await enabledIn(join(tmp, "config"), join(repo, "sub")))
          .toEqual([]);
      });
    });
  });

  describe("settings.local.json", () => {
    it("is read from the repository root when started in a subdirectory", async () => {
      await withTempDir(async (tmp) => {
        const repo = join(tmp, "repo");
        await Deno.mkdir(join(repo, ".git"), { recursive: true });
        await writeJson(
          join(repo, ".claude", "settings.local.json"),
          enabling("l@m"),
        );
        await Deno.mkdir(join(repo, "a", "b"), { recursive: true });
        expect(await enabledIn(join(tmp, "config"), join(repo, "a", "b")))
          .toEqual(["l@m"]);
      });
    });

    it("prefers the repository root over a file left in the working directory", async () => {
      await withTempDir(async (tmp) => {
        const repo = join(tmp, "repo");
        const sub = join(repo, "sub");
        await Deno.mkdir(join(repo, ".git"), { recursive: true });
        await writeJson(join(repo, ".claude", "settings.local.json"), {
          enabledPlugins: { "both@m": false },
        });
        await writeJson(join(sub, ".claude", "settings.local.json"), {
          enabledPlugins: { "both@m": true, "cwd-only@m": true },
        });
        expect(await enabledIn(join(tmp, "config"), sub)).toEqual([
          "cwd-only@m",
        ]);
      });
    });

    it("is read from the main checkout in a linked worktree", async () => {
      await withTempDir(async (tmp) => {
        const main = join(tmp, "main");
        const gitDir = join(main, ".git", "worktrees", "wt");
        const worktree = join(tmp, "wt");
        await Deno.mkdir(gitDir, { recursive: true });
        await Deno.writeTextFile(join(gitDir, "commondir"), "../..\n");
        await Deno.mkdir(worktree, { recursive: true });
        await Deno.writeTextFile(join(worktree, ".git"), `gitdir: ${gitDir}\n`);
        await writeJson(
          join(main, ".claude", "settings.local.json"),
          enabling("l@m"),
        );
        expect(await enabledIn(join(tmp, "config"), worktree)).toEqual([
          "l@m",
        ]);
      });
    });

    it("stays in the working directory when the repository root is home", async () => {
      await withTempDir(async (home) => {
        await Deno.mkdir(join(home, ".git"), { recursive: true });
        await writeJson(
          join(home, ".claude", "settings.local.json"),
          enabling("root@m"),
        );
        const cwd = join(home, "work");
        await writeJson(
          join(cwd, ".claude", "settings.local.json"),
          enabling("cwd@m"),
        );
        expect(await enabledIn(join(home, "config"), cwd, home)).toEqual([
          "cwd@m",
        ]);
      });
    });

    it("is read from the working directory outside a repository", async () => {
      await withTempDir(async (tmp) => {
        await writeJson(
          join(tmp, "work", ".claude", "settings.local.json"),
          enabling("l@m"),
        );
        expect(await enabledIn(join(tmp, "config"), join(tmp, "work")))
          .toEqual(["l@m"]);
      });
    });
  });

  describe("managed settings", () => {
    it("override every other file in both directions", async () => {
      await withTempDir(async (tmp) => {
        const managed = join(tmp, "managed");
        const project = join(tmp, "project");
        await writeJson(join(project, ".claude", "settings.local.json"), {
          enabledPlugins: { "forced@m": false, "blocked@m": true },
        });
        await writeJson(join(managed, "managed-settings.json"), {
          enabledPlugins: { "forced@m": true, "blocked@m": false },
        });
        expect(await enabledIn(join(tmp, "config"), project, "", managed))
          .toEqual(["forced@m"]);
      });
    });

    it("merge drop-in files after the base file in alphabetical order", async () => {
      await withTempDir(async (tmp) => {
        const managed = join(tmp, "managed");
        const dropIns = join(managed, "managed-settings.d");
        await writeJson(join(managed, "managed-settings.json"), {
          enabledPlugins: { "base@m": true, "later@m": true, "kept@m": true },
        });
        await writeJson(join(dropIns, "20-second.json"), {
          enabledPlugins: { "later@m": true, "first@m": true },
        });
        await writeJson(join(dropIns, "10-first.json"), {
          enabledPlugins: { "later@m": false, "first@m": false },
        });
        await writeJson(join(dropIns, "30-third.json"), {
          enabledPlugins: { "base@m": false },
        });
        expect(await enabledIn(join(tmp, "config"), tmp, "", managed))
          .toEqual(["first@m", "kept@m", "later@m"]);
      });
    });

    it("ignore hidden and non-JSON drop-in files", async () => {
      await withTempDir(async (tmp) => {
        const managed = join(tmp, "managed");
        const dropIns = join(managed, "managed-settings.d");
        await writeJson(join(tmp, "config", "settings.json"), {
          enabledPlugins: { "a@m": true, "b@m": true },
        });
        await writeJson(join(dropIns, ".hidden.json"), {
          enabledPlugins: { "a@m": false },
        });
        await writeJson(join(dropIns, "notes.txt"), {
          enabledPlugins: { "b@m": false },
        });
        expect(await enabledIn(join(tmp, "config"), tmp, "", managed))
          .toEqual(["a@m", "b@m"]);
      });
    });

    it("are read from drop-in files alone without a base file", async () => {
      await withTempDir(async (tmp) => {
        const managed = join(tmp, "managed");
        await writeJson(
          join(managed, "managed-settings.d", "10-plugins.json"),
          enabling("d@m"),
        );
        expect(await enabledIn(join(tmp, "config"), tmp, "", managed))
          .toEqual(["d@m"]);
      });
    });

    it("are not read when no managed directory is given", async () => {
      await withTempDir(async (tmp) => {
        const managed = join(tmp, "managed");
        await writeJson(
          join(managed, "managed-settings.json"),
          enabling("m@m"),
        );
        expect(await enabledIn(join(tmp, "config"), tmp)).toEqual([]);
      });
    });
  });
});
