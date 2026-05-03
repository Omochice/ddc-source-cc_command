import type { Item } from "jsr:@shougo/ddc-vim@10.3.0/types";

/**
 * Built-in Claude Code slash commands shipped with the CLI itself.
 *
 * Each entry pairs the slash word that triggers completion with a short
 * description used as the candidate's `info` text.
 */
export const builtins = [
  { word: "/add-dir", info: "Add a working directory for file access" },
  { word: "/agents", info: "Manage agent configurations" },
  {
    word: "/allowed-tools",
    info: "Manage tool permission rules (alias for /permissions)",
  },
  {
    word: "/android",
    info: "Show QR code to download the Claude mobile app (alias for /mobile)",
  },
  {
    word: "/app",
    info:
      "Continue the current session in the Claude Code Desktop app (alias for /desktop)",
  },
  {
    word: "/autofix-pr",
    info:
      "Spawn a web session that watches the PR and pushes fixes for CI failures",
  },
  {
    word: "/bashes",
    info: "List and manage background tasks (alias for /tasks)",
  },
  {
    word: "/batch",
    info:
      "Orchestrate large-scale changes across a codebase in parallel (skill)",
  },
  {
    word: "/branch",
    info: "Create a branch of the current conversation at this point",
  },
  {
    word: "/btw",
    info: "Ask a quick side question without adding to the conversation",
  },
  {
    word: "/bug",
    info: "Submit feedback about Claude Code (alias for /feedback)",
  },
  {
    word: "/checkpoint",
    info:
      "Rewind the conversation and/or code to a previous point (alias for /rewind)",
  },
  { word: "/chrome", info: "Configure Claude in Chrome settings" },
  {
    word: "/claude-api",
    info:
      "Load Claude API reference material for your project's language (skill)",
  },
  {
    word: "/clear",
    info: "Start a new conversation with empty context",
  },
  {
    word: "/color",
    info: "Set the prompt bar color for the current session",
  },
  {
    word: "/compact",
    info: "Free up context by summarizing the conversation so far",
  },
  { word: "/config", info: "Open the Settings interface" },
  {
    word: "/context",
    info: "Visualize current context usage as a colored grid",
  },
  {
    word: "/continue",
    info: "Resume a conversation by ID or name (alias for /resume)",
  },
  {
    word: "/copy",
    info: "Copy the last assistant response to clipboard",
  },
  {
    word: "/cost",
    info: "Show plan usage limits and activity stats (alias for /usage)",
  },
  {
    word: "/debug",
    info: "Enable debug logging and troubleshoot session issues (skill)",
  },
  {
    word: "/desktop",
    info: "Continue the current session in the Claude Code Desktop app",
  },
  {
    word: "/diff",
    info:
      "Open an interactive diff viewer for uncommitted and per-turn changes",
  },
  {
    word: "/doctor",
    info: "Diagnose and verify your Claude Code installation and settings",
  },
  { word: "/effort", info: "Set the model effort level" },
  { word: "/exit", info: "Exit the CLI" },
  {
    word: "/export",
    info: "Export the current conversation as plain text",
  },
  {
    word: "/extra-usage",
    info: "Configure extra usage to keep working when rate limits are hit",
  },
  { word: "/fast", info: "Toggle fast mode on or off" },
  { word: "/feedback", info: "Submit feedback about Claude Code" },
  {
    word: "/fewer-permission-prompts",
    info:
      "Add an allowlist for common read-only tools to project settings (skill)",
  },
  {
    word: "/focus",
    info: "Toggle the focus view (last prompt, tool summary, final response)",
  },
  {
    word: "/fork",
    info: "Create a branch of the current conversation (alias for /branch)",
  },
  {
    word: "/heapdump",
    info:
      "Write a JS heap snapshot and memory breakdown for diagnosing memory usage",
  },
  { word: "/help", info: "Show help and available commands" },
  { word: "/hooks", info: "View hook configurations for tool events" },
  { word: "/ide", info: "Manage IDE integrations and show status" },
  { word: "/init", info: "Initialize project with a CLAUDE.md guide" },
  {
    word: "/insights",
    info: "Generate a report analyzing your Claude Code sessions",
  },
  {
    word: "/install-github-app",
    info: "Set up the Claude GitHub Actions app for a repository",
  },
  {
    word: "/install-slack-app",
    info: "Install the Claude Slack app via OAuth",
  },
  {
    word: "/ios",
    info: "Show QR code to download the Claude mobile app (alias for /mobile)",
  },
  {
    word: "/keybindings",
    info: "Open or create your keybindings configuration file",
  },
  { word: "/login", info: "Sign in to your Anthropic account" },
  { word: "/logout", info: "Sign out from your Anthropic account" },
  {
    word: "/loop",
    info: "Run a prompt repeatedly while the session stays open (skill)",
  },
  {
    word: "/mcp",
    info: "Manage MCP server connections and OAuth authentication",
  },
  {
    word: "/memory",
    info: "Edit CLAUDE.md memory files and manage auto-memory entries",
  },
  {
    word: "/mobile",
    info: "Show QR code to download the Claude mobile app",
  },
  { word: "/model", info: "Select or change the AI model" },
  {
    word: "/new",
    info: "Start a new conversation with empty context (alias for /clear)",
  },
  {
    word: "/passes",
    info: "Share a free week of Claude Code with friends",
  },
  {
    word: "/permissions",
    info: "Manage allow, ask, and deny rules for tool permissions",
  },
  { word: "/plan", info: "Enter plan mode directly from the prompt" },
  { word: "/plugin", info: "Manage Claude Code plugins" },
  {
    word: "/powerup",
    info: "Discover Claude Code features through interactive lessons",
  },
  {
    word: "/privacy-settings",
    info: "View and update your privacy settings (Pro and Max only)",
  },
  {
    word: "/proactive",
    info:
      "Run a prompt repeatedly while the session stays open (alias for /loop)",
  },
  { word: "/quit", info: "Exit the CLI (alias for /exit)" },
  {
    word: "/rc",
    info:
      "Make this session available for remote control (alias for /remote-control)",
  },
  {
    word: "/recap",
    info: "Generate a one-line summary of the current session",
  },
  {
    word: "/release-notes",
    info: "View the changelog in an interactive version picker",
  },
  {
    word: "/reload-plugins",
    info:
      "Reload all active plugins to apply pending changes without restarting",
  },
  {
    word: "/remote-control",
    info: "Make this session available for remote control from claude.ai",
  },
  {
    word: "/remote-env",
    info: "Configure the default remote environment for web sessions",
  },
  {
    word: "/rename",
    info: "Rename the current session and show the name on the prompt bar",
  },
  {
    word: "/reset",
    info: "Start a new conversation with empty context (alias for /clear)",
  },
  {
    word: "/resume",
    info: "Resume a conversation by ID or name, or open the session picker",
  },
  {
    word: "/review",
    info: "Review a pull request locally in your current session",
  },
  {
    word: "/rewind",
    info: "Rewind the conversation and/or code to a previous point",
  },
  {
    word: "/routines",
    info: "Create, update, list, or run routines (alias for /schedule)",
  },
  { word: "/sandbox", info: "Toggle sandbox mode" },
  { word: "/schedule", info: "Create, update, list, or run routines" },
  {
    word: "/security-review",
    info:
      "Analyze pending changes on the current branch for security vulnerabilities",
  },
  {
    word: "/settings",
    info: "Open the Settings interface (alias for /config)",
  },
  {
    word: "/setup-bedrock",
    info: "Configure Amazon Bedrock authentication, region, and model pins",
  },
  {
    word: "/setup-vertex",
    info: "Configure Google Vertex AI authentication, project, and region",
  },
  {
    word: "/simplify",
    info:
      "Review recently changed files for reuse, quality, and efficiency (skill)",
  },
  { word: "/skills", info: "List available skills" },
  {
    word: "/stats",
    info: "Show plan usage limits and activity stats (alias for /usage)",
  },
  { word: "/status", info: "Open the Settings interface (Status tab)" },
  { word: "/statusline", info: "Configure Claude Code's status line" },
  { word: "/stickers", info: "Order Claude Code stickers" },
  { word: "/tasks", info: "List and manage background tasks" },
  {
    word: "/team-onboarding",
    info:
      "Generate a team onboarding guide from your Claude Code usage history",
  },
  {
    word: "/teleport",
    info: "Pull a Claude Code on the web session into this terminal",
  },
  {
    word: "/terminal-setup",
    info: "Configure terminal keybindings for Shift+Enter and other shortcuts",
  },
  { word: "/theme", info: "Change the color theme" },
  {
    word: "/tp",
    info:
      "Pull a Claude Code on the web session into this terminal (alias for /teleport)",
  },
  {
    word: "/tui",
    info: "Set the terminal UI renderer (default or fullscreen)",
  },
  {
    word: "/ultraplan",
    info:
      "Draft a plan in an ultraplan session, review it, then execute remotely or locally",
  },
  {
    word: "/ultrareview",
    info: "Run a deep, multi-agent code review in a cloud sandbox",
  },
  {
    word: "/undo",
    info:
      "Rewind the conversation and/or code to a previous point (alias for /rewind)",
  },
  {
    word: "/upgrade",
    info: "Open the upgrade page to switch to a higher plan tier",
  },
  {
    word: "/usage",
    info: "Show session cost, plan usage limits, and activity stats",
  },
  {
    word: "/voice",
    info: "Toggle voice dictation, or enable it in a specific mode",
  },
  {
    word: "/web-setup",
    info:
      "Connect your GitHub account to Claude Code on the web using your gh CLI credentials",
  },
] as const satisfies Item[];
