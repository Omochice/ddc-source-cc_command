import { describe, it } from "jsr:@std/testing@1/bdd";
import { expect } from "jsr:@std/expect@1";
import { join } from "jsr:@std/path@1";
import { collectPlugins } from "./plugin.ts";
import type { Session } from "./session.ts";

function sessionAt(cwd: string, homeDir = ""): Session {
  return { cwd, homeDir, managedSettingsDir: null };
}

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

async function installPlugin(
  configDir: string,
  root: string,
  key: string,
  options: { name?: string; scope?: string; projectPath?: string } = {},
): Promise<string> {
  const installPath = join(root, key.replace("@", "-"));
  await Deno.mkdir(join(installPath, "commands", "sub"), { recursive: true });
  await Deno.mkdir(join(installPath, "skills", "lint"), { recursive: true });
  await Deno.writeTextFile(
    join(installPath, "commands", "hello.md"),
    "---\ndescription: say hello\n---\n",
  );
  await Deno.writeTextFile(join(installPath, "commands", "sub", "deep.md"), "");
  await Deno.writeTextFile(
    join(installPath, "skills", "lint", "SKILL.md"),
    "---\ndescription: lint it\n---\n",
  );
  if (options.name != null) {
    await writeJson(join(installPath, ".claude-plugin", "plugin.json"), {
      name: options.name,
    });
  }
  const registryPath = join(configDir, "plugins", "installed_plugins.json");
  let registry: { version: number; plugins: Record<string, unknown[]> } = {
    version: 2,
    plugins: {},
  };
  try {
    registry = JSON.parse(await Deno.readTextFile(registryPath));
  } catch {
    // first plugin of the test
  }
  registry.plugins[key] = [{
    scope: options.scope ?? "user",
    installPath,
    ...(options.projectPath ? { projectPath: options.projectPath } : {}),
  }];
  await writeJson(registryPath, registry);
  return installPath;
}

describe("collectPlugins", () => {
  it("returns [] when installed_plugins.json is missing", async () => {
    await withTempDir(async (configDir) => {
      expect(await collectPlugins(configDir, sessionAt(configDir)))
        .toEqual([]);
    });
  });

  it("returns [] when installed_plugins.json is malformed", async () => {
    await withTempDir(async (configDir) => {
      await Deno.mkdir(join(configDir, "plugins"));
      await Deno.writeTextFile(
        join(configDir, "plugins", "installed_plugins.json"),
        "{not json",
      );
      expect(await collectPlugins(configDir, sessionAt(configDir)))
        .toEqual([]);
    });
  });

  it("excludes plugins that are not enabled", async () => {
    await withTempDir(async (configDir) => {
      await installPlugin(configDir, configDir, "off@mkt");
      await installPlugin(configDir, configDir, "unlisted@mkt");
      await writeJson(join(configDir, "settings.json"), {
        enabledPlugins: { "off@mkt": false },
      });
      expect(await collectPlugins(configDir, sessionAt(configDir)))
        .toEqual([]);
    });
  });

  it("namespaces commands and skills of an enabled plugin", async () => {
    await withTempDir(async (configDir) => {
      await installPlugin(configDir, configDir, "tools@mkt");
      await writeJson(join(configDir, "settings.json"), {
        enabledPlugins: { "tools@mkt": true },
      });
      const items = await collectPlugins(configDir, sessionAt(configDir));
      expect(items.map((i) => i.word).sort()).toEqual([
        "/tools:hello",
        "/tools:lint",
        "/tools:sub:deep",
      ]);
      expect(items.find((i) => i.word === "/tools:hello")?.info).toBe(
        "say hello",
      );
    });
  });

  it("prefers the name in plugin.json over the key", async () => {
    await withTempDir(async (configDir) => {
      await installPlugin(configDir, configDir, "tools@mkt", {
        name: "renamed",
      });
      await writeJson(join(configDir, "settings.json"), {
        enabledPlugins: { "tools@mkt": true },
      });
      const items = await collectPlugins(configDir, sessionAt(configDir));
      expect(items.map((i) => i.word)).toContain("/renamed:hello");
      expect(items.map((i) => i.word)).not.toContain("/tools:hello");
    });
  });

  it("lets project settings override user settings, local over shared", async () => {
    await withTempDir(async (tmp) => {
      const configDir = join(tmp, "config");
      const homeDir = join(tmp, "home");
      const projectRoot = join(tmp, "project");
      const dotClaude = join(projectRoot, ".claude");
      await installPlugin(configDir, tmp, "a@mkt");
      await installPlugin(configDir, tmp, "b@mkt");
      await writeJson(join(configDir, "settings.json"), {
        enabledPlugins: { "a@mkt": true, "b@mkt": false },
      });
      await writeJson(join(dotClaude, "settings.json"), {
        enabledPlugins: { "a@mkt": false, "b@mkt": true },
      });
      const shared = await collectPlugins(
        configDir,
        sessionAt(projectRoot, homeDir),
      );
      expect(shared.every((i) => i.word.startsWith("/b:"))).toBe(true);
      expect(shared.length).toBe(3);

      await writeJson(join(dotClaude, "settings.local.json"), {
        enabledPlugins: { "b@mkt": false },
      });
      expect(await collectPlugins(configDir, sessionAt(projectRoot, homeDir)))
        .toEqual([]);
    });
  });

  describe("install scope", () => {
    async function installScoped(
      tmp: string,
      scope: string,
      projectPath?: string,
    ): Promise<string> {
      const configDir = join(tmp, "config");
      await installPlugin(configDir, tmp, "p@mkt", { scope, projectPath });
      await writeJson(join(configDir, "settings.json"), {
        enabledPlugins: { "p@mkt": true },
      });
      return configDir;
    }

    async function offeredIn(configDir: string, cwd: string): Promise<boolean> {
      await Deno.mkdir(cwd, { recursive: true });
      const items = await collectPlugins(configDir, sessionAt(cwd));
      return items.some((i) => i.word === "/p:hello");
    }

    for (const scope of ["user", "managed"]) {
      it(`offers a ${scope}-scoped install everywhere`, async () => {
        await withTempDir(async (tmp) => {
          const configDir = await installScoped(tmp, scope);
          expect(await offeredIn(configDir, join(tmp, "anywhere"))).toBe(true);
        });
      });
    }

    for (const scope of ["project", "local"]) {
      describe(`a ${scope}-scoped install`, () => {
        it("is offered in its project directory", async () => {
          await withTempDir(async (tmp) => {
            const project = join(tmp, "project");
            const configDir = await installScoped(tmp, scope, project);
            expect(await offeredIn(configDir, project)).toBe(true);
          });
        });

        it("is offered anywhere in the same repository", async () => {
          await withTempDir(async (tmp) => {
            const repo = join(tmp, "repo");
            await Deno.mkdir(join(repo, ".git"), { recursive: true });
            const configDir = await installScoped(
              tmp,
              scope,
              join(repo, "packages", "a"),
            );
            expect(await offeredIn(configDir, join(repo, "packages", "b")))
              .toBe(true);
            expect(await offeredIn(configDir, repo)).toBe(true);
          });
        });

        it("is offered in a linked worktree of its repository", async () => {
          await withTempDir(async (tmp) => {
            const main = join(tmp, "main");
            const gitDir = join(main, ".git", "worktrees", "wt");
            await Deno.mkdir(gitDir, { recursive: true });
            await Deno.writeTextFile(join(gitDir, "commondir"), "../..\n");
            const worktree = join(tmp, "wt");
            await Deno.mkdir(worktree, { recursive: true });
            await Deno.writeTextFile(
              join(worktree, ".git"),
              `gitdir: ${gitDir}\n`,
            );
            const configDir = await installScoped(tmp, scope, main);
            expect(await offeredIn(configDir, worktree)).toBe(true);
          });
        });

        it("is not offered in a subdirectory outside a repository", async () => {
          await withTempDir(async (tmp) => {
            const project = join(tmp, "project");
            const configDir = await installScoped(tmp, scope, project);
            expect(await offeredIn(configDir, join(project, "sub"))).toBe(
              false,
            );
          });
        });

        it("is not offered in another repository", async () => {
          await withTempDir(async (tmp) => {
            await Deno.mkdir(join(tmp, "a", ".git"), { recursive: true });
            await Deno.mkdir(join(tmp, "b", ".git"), { recursive: true });
            const configDir = await installScoped(tmp, scope, join(tmp, "a"));
            expect(await offeredIn(configDir, join(tmp, "b"))).toBe(false);
          });
        });

        it("is not offered without a projectPath", async () => {
          await withTempDir(async (tmp) => {
            const configDir = await installScoped(tmp, scope);
            expect(await offeredIn(configDir, tmp)).toBe(false);
          });
        });
      });
    }
  });
});
