import { extract } from "jsr:@std/front-matter@1.0.9/yaml";
import { test as hasFrontmatter } from "jsr:@std/front-matter@1.0.9/test";

/**
 * Returns the `description` field from YAML frontmatter at the start of `text`.
 *
 * Tries `@std/front-matter` first. When the YAML parser rejects the document
 * (e.g. an `argument-hint: [a] [b]` line where two flow sequences are not
 * separated), falls back to a minimal extractor that only inspects the
 * `description` key. Returns "" when no frontmatter is present, no
 * description is declared, or the value is not a string.
 */
export function parseDescription(text: string): string {
  if (!hasFrontmatter(text, ["yaml"])) {
    return "";
  }
  try {
    const attrs = extract<Record<string, unknown>>(text).attrs;
    const description = attrs["description"];
    return typeof description === "string" ? description : "";
  } catch {
    return descriptionFromRawFrontmatter(text);
  }
}

/**
 * Best-effort extractor used when std/yaml fails. Reads the raw frontmatter
 * block and pulls just the `description` value. Supports plain scalars,
 * single/double quoted scalars, and `|` / `>` block scalars.
 */
function descriptionFromRawFrontmatter(text: string): string {
  const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!block) {
    return "";
  }
  const lines = block[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const head = lines[i].match(/^description\s*:\s*(.*)$/);
    if (!head) continue;
    const value = head[1].trim();
    const blockScalar = value.match(/^([|>])[+-]?$/);
    if (blockScalar) {
      return readBlockScalar(lines, i + 1, blockScalar[1] === "|");
    }
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      return value.slice(1, -1);
    }
    return value;
  }
  return "";
}

function readBlockScalar(
  lines: string[],
  start: number,
  literal: boolean,
): string {
  const collected: string[] = [];
  let baseIndent: number | null = null;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") {
      collected.push("");
      continue;
    }
    const indent = line.match(/^( *)/)![1].length;
    if (baseIndent === null) {
      if (indent === 0) break;
      baseIndent = indent;
    } else if (indent < baseIndent) {
      break;
    }
    collected.push(line.slice(baseIndent));
  }
  while (collected.length > 0 && collected[collected.length - 1] === "") {
    collected.pop();
  }
  return collected.join(literal ? "\n" : " ");
}
