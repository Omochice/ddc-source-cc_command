import { extract } from "jsr:@std/front-matter@1.0.9/yaml";
import { test as hasFrontmatter } from "jsr:@std/front-matter@1.0.9/test";

/**
 * The frontmatter fields this source reads.
 * Each is "" when no frontmatter is present, the field is not declared, or
 * its value is not a string.
 */
export type Frontmatter = {
  description: string;
};

function fieldsOf(read: (key: string) => string): Frontmatter {
  return { description: read("description") };
}

/**
 * Reads the fields of YAML frontmatter at the start of `text`.
 *
 * Tries `@std/front-matter` first. When the YAML parser rejects the document
 * (e.g. an `argument-hint: [a] [b]` line where two flow sequences are not
 * separated), falls back to a minimal extractor that only inspects the keys
 * of {@link Frontmatter}.
 */
export function parseFrontmatter(text: string): Frontmatter {
  if (!hasFrontmatter(text, ["yaml"])) {
    return fieldsOf(() => "");
  }
  try {
    const attrs = extract<Record<string, unknown>>(text).attrs;
    return fieldsOf((key) => {
      const value = attrs[key];
      return typeof value === "string" ? value : "";
    });
  } catch {
    const lines = rawFrontmatterLines(text);
    return fieldsOf((key) => scalarFromRawFrontmatter(lines, key));
  }
}

function rawFrontmatterLines(text: string): string[] {
  const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return block ? block[1].split(/\r?\n/) : [];
}

/**
 * Best-effort extractor used when std/yaml fails. Pulls just the value of
 * `key` from the raw frontmatter lines. Supports plain scalars,
 * single/double quoted scalars, and `|` / `>` block scalars.
 */
function scalarFromRawFrontmatter(lines: string[], key: string): string {
  const keyPattern = new RegExp(`^${key}\\s*:\\s*(.*)$`);
  for (let i = 0; i < lines.length; i++) {
    const head = lines[i].match(keyPattern);
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
    return YAML_NON_STRING_SCALAR.test(value) ? "" : value;
  }
  return "";
}

// Plain-scalar values whose YAML core-schema type is not a string.
// `@std/front-matter` resolves these to non-string and `parseFrontmatter`
// then returns "" via the typeof guard; the fallback must follow the same
// contract so a malformed sibling field cannot turn `description: true`
// into the literal string "true".
const YAML_NON_STRING_SCALAR =
  /^(|null|Null|NULL|~|true|True|TRUE|false|False|FALSE|[-+]?\d+|[-+]?\d*\.\d+|[-+]?\d+\.\d*|[-+]?\d+(\.\d*)?[eE][-+]?\d+)$/;

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
  if (collected.length === 0) {
    return "";
  }
  return collected.join(literal ? "\n" : " ") + "\n";
}
