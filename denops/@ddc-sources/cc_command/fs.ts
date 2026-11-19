/**
 * What a path names once symlinks are followed.
 */
export type PathKind = "file" | "directory" | "other";

/**
 * Tells what `path` names, following symlinks.
 *
 * @param entry The directory entry for `path`, which saves a stat unless it is a symlink.
 * @returns `"other"` for a missing path or a broken symlink.
 */
export async function pathKind(
  path: string,
  entry?: Deno.DirEntry,
): Promise<PathKind> {
  if (entry?.isFile) {
    return "file";
  }
  if (entry?.isDirectory) {
    return "directory";
  }
  if (entry != null && !entry.isSymlink) {
    return "other";
  }
  try {
    const stat = await Deno.stat(path);
    if (stat.isFile) {
      return "file";
    }
    if (stat.isDirectory) {
      return "directory";
    }
    return "other";
  } catch {
    return "other";
  }
}

/**
 * Lists the entries of a directory.
 *
 * @returns The entries, or `[]` when the directory is missing or unreadable.
 */
export async function readDirEntries(dir: string): Promise<Deno.DirEntry[]> {
  try {
    const entries: Deno.DirEntry[] = [];
    for await (const entry of Deno.readDir(dir)) {
      entries.push(entry);
    }
    return entries;
  } catch {
    return [];
  }
}

/**
 * Reads a text file, warning instead of throwing when it cannot be read.
 *
 * @returns The text, or `null` when the file cannot be read.
 */
export async function readTextFileSafe(path: string): Promise<string | null> {
  try {
    return await Deno.readTextFile(path);
  } catch (err) {
    console.warn(`Failed to read "${path}": ${err}`);
    return null;
  }
}
