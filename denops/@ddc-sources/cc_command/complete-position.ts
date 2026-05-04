const re = /(?:^|\s)(?<command>\/\S*)$/d;

/**
 * Returns the character position (JS string index) at which a slash-command
 * completion target starts within the given line content up to the cursor.
 *
 * ddc.vim treats the value returned by `getCompletePosition` as a UTF-16
 * code unit offset by default and converts it to a byte column via
 * `charposToBytepos` before passing it to Vim's `complete()`. Returning a
 * byte offset here without setting `isBytePos` would double-convert, so a
 * JS string index is the correct unit.
 *
 * The leading `/` itself is included in the replacement range so that the
 * selected candidate (e.g. `/help`) overwrites the slash the user already
 * typed. Only a slash that begins the line or immediately follows whitespace
 * is considered, which avoids triggering on path-like tokens such as
 * `src/foo`.
 *
 * @param input The current line content from the start of line up to the cursor position.
 * @returns The string index of the leading `/` in `input`, or `-1` if no slash command is being typed at the cursor.
 */
export function findSlashCommandStart(input: string): number {
  const command = input.match(re)?.indices?.groups?.command;
  if (command === undefined) {
    return -1;
  }
  return command[0];
}
