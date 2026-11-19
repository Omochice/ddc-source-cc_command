/**
 * A parsed JSON object.
 */
export type JsonObject = Record<string, unknown>;

/**
 * Tells whether `value` is a JSON object rather than an array, `null` or a scalar.
 */
export function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

/**
 * Reads and parses a JSON file.
 *
 * @returns The parsed value, or `undefined` when the file is missing, unreadable or malformed.
 */
export async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await Deno.readTextFile(path));
  } catch {
    return undefined;
  }
}
