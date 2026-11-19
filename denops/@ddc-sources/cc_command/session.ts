/**
 * Where a Claude Code session runs, which decides the settings files and
 * project-scoped installs that apply to it.
 */
export type Session = {
  /** The session's primary working directory. */
  cwd: string;
  /** The user's home directory, or "" when unknown. */
  homeDir: string;
  /**
   * The system directory holding `managed-settings.json`, or `null` to leave
   * managed settings out.
   */
  managedSettingsDir: string | null;
};
