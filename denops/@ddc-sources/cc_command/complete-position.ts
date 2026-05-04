const re = /(?:^|\s)(?<command>\/\S*)$/d;

/**
 * Locates the start of a slash-command target in `input` so the leading
 * `/` is included in the completion replacement range. Only a slash at
 * start-of-line or immediately following whitespace is matched, which
 * keeps path-like tokens such as `src/foo` from triggering completion.
 *
 * The return value is a JS string index. ddc.vim converts it to a byte
 * column via `charposToBytepos` before forwarding it to Vim's `complete()`,
 * so returning a byte offset here without setting `isBytePos` would
 * double-convert.
 *
 * @param input Line content from the start of line up to the cursor position.
 * @returns The string index of the leading `/`, or `-1` if no slash command is being typed at the cursor.
 */
export function findSlashCommandStart(input: string): number {
  const command = input.match(re)?.indices?.groups?.command;
  if (command == null) {
    return -1;
  }
  return command[0];
}
