import { describe, it } from "jsr:@std/testing@1/bdd";
import { expect } from "jsr:@std/expect@1";
import { join } from "jsr:@std/path@1";
import { canonicalPath, findGitRoot } from "./git-root.ts";

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir();
  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

async function linkWorktree(main: string, worktree: string): Promise<void> {
  const gitDir = join(main, ".git", "worktrees", "wt");
  await Deno.mkdir(gitDir, { recursive: true });
  await Deno.writeTextFile(join(gitDir, "commondir"), "../..\n");
  await Deno.mkdir(worktree, { recursive: true });
  await Deno.writeTextFile(join(worktree, ".git"), `gitdir: ${gitDir}\n`);
}

describe("findGitRoot", () => {
  it("returns null outside a repository", async () => {
    await withTempDir(async (tmp) => {
      expect(await findGitRoot(tmp)).toBeNull();
    });
  });

  it("returns the nearest ancestor holding a .git directory", async () => {
    await withTempDir(async (tmp) => {
      await Deno.mkdir(join(tmp, "repo", ".git"), { recursive: true });
      await Deno.mkdir(join(tmp, "repo", "a", "b"), { recursive: true });
      expect(await findGitRoot(join(tmp, "repo", "a", "b"))).toBe(
        await canonicalPath(join(tmp, "repo")),
      );
    });
  });

  it("finds the repository of a directory that no longer exists", async () => {
    await withTempDir(async (tmp) => {
      await Deno.mkdir(join(tmp, "repo", ".git"), { recursive: true });
      expect(await findGitRoot(join(tmp, "repo", "gone"))).toBe(
        await canonicalPath(join(tmp, "repo")),
      );
    });
  });

  it("resolves a linked worktree to its main checkout", async () => {
    await withTempDir(async (tmp) => {
      const main = join(tmp, "main");
      const worktree = join(tmp, "elsewhere", "wt");
      await linkWorktree(main, worktree);
      expect(await findGitRoot(worktree)).toBe(await canonicalPath(main));
    });
  });

  it("resolves a relative gitdir against the .git file", async () => {
    await withTempDir(async (tmp) => {
      const main = join(tmp, "main");
      const worktree = join(main, ".wt", "feature");
      await linkWorktree(main, worktree);
      await Deno.writeTextFile(
        join(worktree, ".git"),
        "gitdir: ../../.git/worktrees/wt\n",
      );
      expect(await findGitRoot(join(worktree))).toBe(
        await canonicalPath(main),
      );
    });
  });

  it("treats a .git file without commondir as its own root", async () => {
    await withTempDir(async (tmp) => {
      const moduleDir = join(tmp, "super", ".git", "modules", "sub");
      await Deno.mkdir(moduleDir, { recursive: true });
      const sub = join(tmp, "super", "sub");
      await Deno.mkdir(sub, { recursive: true });
      await Deno.writeTextFile(join(sub, ".git"), `gitdir: ${moduleDir}\n`);
      expect(await findGitRoot(sub)).toBe(await canonicalPath(sub));
    });
  });
});

describe("canonicalPath", () => {
  it("resolves symlinks", async () => {
    await withTempDir(async (tmp) => {
      await Deno.mkdir(join(tmp, "real"));
      await Deno.symlink(join(tmp, "real"), join(tmp, "link"));
      expect(await canonicalPath(join(tmp, "link"))).toBe(
        await Deno.realPath(join(tmp, "real")),
      );
    });
  });

  it("falls back to the resolved path when the target is missing", async () => {
    await withTempDir(async (tmp) => {
      expect(await canonicalPath(join(tmp, "missing", "..", "gone"))).toBe(
        join(tmp, "gone"),
      );
    });
  });
});
