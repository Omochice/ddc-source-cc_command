const re = /(?:^|\s)(?<command>\/\S*)$/d;

/**
 * Returns the byte position at which a slash-command completion target starts
 * within the given line content up to the cursor.
 *
 * The leading `/` itself is included in the replacement range so that the
 * selected candidate (e.g. `/help`) overwrites the slash the user already
 * typed. Only a slash that begins the line or immediately follows whitespace
 * is considered, which avoids triggering on path-like tokens such as
 * `src/foo`.
 *
 * @param input The current line content from the start of line up to the cursor position.
 * @returns The position of the leading `/` in `input`, or `-1` if no slash command is being typed at the cursor.
 */
export function findSlashCommandStart(input: string): number {
  const command = input.match(re)?.indices?.groups?.command;
  if (command === undefined) {
    return -1;
  }
  return command[0];
}
