import { basename, dirname, join, resolve } from "jsr:@std/path@1.1.6";

/**
 * Resolves `path` to an absolute path with symlinks followed, so that two
 * spellings of one directory compare equal.
 *
 * @returns The real path, or the lexically resolved path when it cannot be followed.
 */
export async function canonicalPath(path: string): Promise<string> {
  try {
    return await Deno.realPath(path);
  } catch {
    return resolve(path);
  }
}

/**
 * Finds the root of the git checkout that contains `dir`.
 *
 * The root is the nearest ancestor holding a `.git` directory or file.
 * A linked worktree resolves to its main checkout, as Claude Code does when
 * it matches project-scoped installs and places `settings.local.json`.
 *
 * @param dir Directory to start from.
 * @returns The canonical root, or `null` outside a repository.
 */
export async function findGitRoot(dir: string): Promise<string | null> {
  let current = await canonicalPath(dir);
  while (true) {
    const dotGit = join(current, ".git");
    const kind = await statKind(dotGit);
    if (kind === "directory") {
      return current;
    }
    if (kind === "file") {
      return (await mainCheckoutOf(dotGit)) ?? current;
    }
    const parent = dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

/**
 * Only a worktree's git dir carries `commondir`.
 * A submodule's `.git` file has none, and its checkout is its own root.
 * A worktree of a bare repository has no main checkout to point at.
 */
async function mainCheckoutOf(dotGitFile: string): Promise<string | null> {
  const pointer = (await readTextOrNull(dotGitFile))?.match(
    /^gitdir:\s*(.+?)\s*$/m,
  );
  if (pointer == null) {
    return null;
  }
  const gitDir = resolve(dirname(dotGitFile), pointer[1]);
  const commonDir = (await readTextOrNull(join(gitDir, "commondir")))?.trim();
  if (!commonDir) {
    return null;
  }
  const common = resolve(gitDir, commonDir);
  if (basename(common) !== ".git") {
    return null;
  }
  return await canonicalPath(dirname(common));
}

async function statKind(path: string): Promise<"file" | "directory" | null> {
  try {
    const stat = await Deno.stat(path);
    if (stat.isDirectory) {
      return "directory";
    }
    return stat.isFile ? "file" : null;
  } catch {
    return null;
  }
}

async function readTextOrNull(path: string): Promise<string | null> {
  try {
    return await Deno.readTextFile(path);
  } catch {
    return null;
  }
}
