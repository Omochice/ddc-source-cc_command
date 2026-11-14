import type { Item } from "jsr:@shougo/ddc-vim@10.3.0/types";

// NOTE: Commands that the CLI keeps but never shows in
// its slash menu (hidden or permanently disabled ones) are intentionally omitted.

/**
 * Built-in Claude Code slash commands shipped with the CLI itself.
 *
 * Each entry pairs the slash word that triggers completion with a short
 * description used as the candidate's `info` text.
 *
 * The list follows Claude Code 2.1.322.
 */
export const builtins = [
  { word: "/add-dir", info: "Add a new working directory" },
  {
    word: "/advisor",
    info: "Let Claude consult a stronger model at key moments",
  },
  {
    word: "/allowed-tools",
    info:
      "Manage allow and deny tool permission rules (alias for /permissions)",
  },
  {
    word: "/android",
    info: "Show QR code to download the Claude mobile app (alias for /mobile)",
  },
  {
    word: "/app",
    info: "Continue the current session in Claude Desktop (alias for /desktop)",
  },
  {
    word: "/artifact-capabilities",
    info: "Runtime capabilities for published Artifacts (skill)",
  },
  {
    word: "/artifact-diagramming",
    info: "Diagramming guidance for Artifacts (skill)",
  },
  { word: "/artifacts", info: "Browse your published and shared artifacts" },
  {
    word: "/auto-mode-setup",
    info: "Teach auto mode about your environment, plus optional rule tweaks",
  },
  {
    word: "/autocompact",
    info: "Set how full the context gets before auto-summarizing",
  },
  {
    word: "/autofix-pr",
    info: "Monitor and autofix any issues with the current PR",
  },
  {
    word: "/background",
    info: "Send this session to the background and free the terminal",
  },
  {
    word: "/bashes",
    info:
      "View and manage everything running in the background (alias for /tasks)",
  },
  {
    word: "/batch",
    info: "Plan a large change; background agents each open a PR (skill)",
  },
  {
    word: "/bg",
    info:
      "Send this session to the background and free the terminal (alias for /background)",
  },
  {
    word: "/branch",
    info: "Create a branch of the current conversation at this point",
  },
  { word: "/brief", info: "Toggle brief-only mode" },
  {
    word: "/btw",
    info:
      "Ask a quick side question without interrupting the main conversation",
  },
  { word: "/bug", info: "Report a bug or share your conversation" },
  { word: "/cd", info: "Move this session to a new working directory" },
  {
    word: "/checkpoint",
    info:
      "Restore the code and/or conversation to a previous point (alias for /rewind)",
  },
  {
    word: "/checkup",
    info:
      "Health-check your setup and fix issues: installation, unused extensions, duplicated or bloated memory files, slow hooks, updates, permissions (alias for /doctor) (skill)",
  },
  { word: "/chrome", info: "Open Claude in Chrome settings" },
  {
    word: "/claude-api",
    info: "Build and debug apps that use the Claude API (skill)",
  },
  {
    word: "/claude-code-docs",
    info: "Answer questions about Claude Code features and settings (skill)",
  },
  {
    word: "/claude-in-chrome",
    info: "Let Claude browse and interact with pages in your Chrome (skill)",
  },
  {
    word: "/clear",
    info:
      "Start a new session with empty context; previous session stays on disk (resumable with /resume)",
  },
  {
    word: "/cloud-plugins",
    info:
      "Choose whether cloud sessions use the plugins enabled on this machine",
  },
  {
    word: "/code-review",
    info: "Review the current diff or a PR for bugs and cleanups (skill)",
  },
  { word: "/color", info: "Set the prompt bar color for this session" },
  { word: "/commit", info: "Create a git commit (skill)" },
  {
    word: "/compact",
    info: "Free up context by summarizing the conversation so far",
  },
  { word: "/config", info: "Open settings" },
  {
    word: "/context",
    info: "Visualize current context usage as a colored grid",
  },
  {
    word: "/continue",
    info: "Resume a previous conversation (alias for /resume)",
  },
  {
    word: "/copy",
    info:
      "Copy Claude's last response to clipboard (or /copy N for the Nth-latest)",
  },
  {
    word: "/cost",
    info:
      "Show session cost, plan usage, and activity stats (alias for /usage)",
  },
  { word: "/dataviz", info: "Chart and dashboard design guidance (skill)" },
  {
    word: "/debug",
    info: "Turn on debug logging and investigate problems (skill)",
  },
  { word: "/design", info: "Make a new Design artifact from a brief (skill)" },
  {
    word: "/design-login",
    info:
      "Authorize design-system access for /design-sync with your claude.ai account",
  },
  {
    word: "/design-sync",
    info: "Push your design system components to claude.ai/design (skill)",
  },
  { word: "/desktop", info: "Continue the current session in Claude Desktop" },
  { word: "/diff", info: "View uncommitted changes and per-turn diffs" },
  {
    word: "/doctor",
    info:
      "Health-check your setup and fix issues: installation, unused extensions, duplicated or bloated memory files, slow hooks, updates, permissions (skill)",
  },
  { word: "/effort", info: "Set effort level for model usage" },
  { word: "/exit", info: "Exit the CLI" },
  {
    word: "/explain-usage",
    info: "See where this session’s tokens went, in plain words (skill)",
  },
  {
    word: "/export",
    info: "Export the current conversation to a file or clipboard",
  },
  { word: "/fast", info: "Toggle fast mode" },
  { word: "/feedback", info: "Send feedback to Anthropic or report a bug" },
  {
    word: "/fewer-permission-prompts",
    info: "Pre-approve safe read-only commands based on your usage (skill)",
  },
  {
    word: "/focus",
    info: "Toggle focus view: just your prompt, summary, and response",
  },
  {
    word: "/fork",
    info:
      "Copy this conversation into a new background session and keep working here",
  },
  { word: "/goal", info: "Set a goal Claude checks before stopping" },
  { word: "/help", info: "Show help and available commands" },
  { word: "/hooks", info: "View hook configurations for tool events" },
  { word: "/ide", info: "Manage IDE integrations and show status" },
  { word: "/import", info: "Import config from another AI coding agent" },
  {
    word: "/init",
    info: "Initialize a new CLAUDE.md file with codebase documentation",
  },
  {
    word: "/insights",
    info: "Generate a report analyzing your Claude Code sessions",
  },
  {
    word: "/install-github-app",
    info: "Set up Claude GitHub Actions for a repository",
  },
  { word: "/install-slack-app", info: "Install the Claude Slack app" },
  {
    word: "/ios",
    info: "Show QR code to download the Claude mobile app (alias for /mobile)",
  },
  { word: "/keybindings", info: "Open your keyboard shortcuts file" },
  {
    word: "/list-agents",
    info:
      "List subagents, teammates, and other Claude sessions you can message",
  },
  { word: "/login", info: "Sign in with your Anthropic account" },
  { word: "/logout", info: "Sign out from your Anthropic account" },
  {
    word: "/loop",
    info:
      "Repeat a prompt or command on an interval (e.g. /loop 5m /foo) (skill)",
  },
  {
    word: "/marketplace",
    info: "Manage Claude Code plugins (alias for /plugin)",
  },
  { word: "/mcp", info: "Manage MCP servers" },
  { word: "/memory", info: "Edit CLAUDE.md files and memory settings" },
  { word: "/mobile", info: "Show QR code to download the Claude mobile app" },
  { word: "/model", info: "Set the AI model for Claude Code" },
  {
    word: "/name",
    info: "Rename the current conversation (alias for /rename)",
  },
  {
    word: "/new",
    info: "Start a new session with empty context (alias for /clear)",
  },
  { word: "/output-style", info: "List output styles or switch to one" },
  { word: "/passes", info: "Share a free week of Claude Code with friends" },
  {
    word: "/peers",
    info:
      "List subagents, teammates, and other Claude sessions you can message (alias for /list-agents)",
  },
  { word: "/permissions", info: "Manage allow and deny tool permission rules" },
  { word: "/plan", info: "Enable plan mode or view the current session plan" },
  { word: "/plugin", info: "Manage Claude Code plugins" },
  {
    word: "/plugin-authoring",
    info:
      "Write a mod: a live pane, view or behaviour change in Claude Code (skill)",
  },
  { word: "/plugins", info: "Manage Claude Code plugins (alias for /plugin)" },
  {
    word: "/powerup",
    info: "Discover Claude Code features through quick interactive lessons",
  },
  { word: "/pr", info: "Create a pull request (skill)" },
  { word: "/privacy-settings", info: "View and update your privacy settings" },
  {
    word: "/proactive",
    info: "Repeat a prompt or command on an interval (alias for /loop) (skill)",
  },
  {
    word: "/project",
    info: "Set the claude.ai Project for this session's usage reports",
  },
  { word: "/quit", info: "Exit the CLI (alias for /exit)" },
  { word: "/radio", info: "Listen to Claude FM lo-fi radio" },
  {
    word: "/rate-limit-options",
    info: "Manage usage limits and upgrade options",
  },
  {
    word: "/rc",
    info:
      "Control this session from your phone or claude.ai/code (alias for /remote-control)",
  },
  { word: "/recap", info: "Generate a one-line session recap now" },
  { word: "/release-notes", info: "View release notes" },
  {
    word: "/reload-plugins",
    info: "Activate pending plugin changes in the current session",
  },
  {
    word: "/reload-skills",
    info: "Pick up skills added or changed on disk during this session",
  },
  {
    word: "/remote",
    info: "Show cloud session URL and QR code (alias for /session)",
  },
  {
    word: "/remote-control",
    info: "Control this session from your phone or claude.ai/code",
  },
  {
    word: "/remote-env",
    info: "Choose the default environment for cloud agents",
  },
  { word: "/rename", info: "Rename the current conversation" },
  {
    word: "/reset",
    info: "Start a new session with empty context (alias for /clear)",
  },
  { word: "/restart", info: "Restart Claude Code and keep this session" },
  { word: "/resume", info: "Resume a previous conversation" },
  {
    word: "/review",
    info:
      "Review the current diff or a PR for bugs and cleanups (alias for /code-review) (skill)",
  },
  {
    word: "/rewind",
    info: "Restore the code and/or conversation to a previous point",
  },
  {
    word: "/routines",
    info:
      "Create and manage routines: cloud agents on a schedule (alias for /schedule) (skill)",
  },
  {
    word: "/run",
    info: "Launch this project’s app to see your change working (skill)",
  },
  {
    word: "/run-skill-generator",
    info: "Create a skill that knows how to run this project’s app (skill)",
  },
  {
    word: "/sandbox",
    info: "Show sandbox status and configure sandbox settings",
  },
  {
    word: "/schedule",
    info: "Create and manage routines: cloud agents on a schedule (skill)",
  },
  { word: "/scroll-speed", info: "Adjust mouse wheel scroll speed" },
  {
    word: "/security-review",
    info:
      "Complete a security review of the pending changes on the current branch",
  },
  {
    word: "/send-to-project",
    info: "Send this session's work to a Claude Project (skill)",
  },
  { word: "/session", info: "Show cloud session URL and QR code" },
  { word: "/settings", info: "Open settings (alias for /config)" },
  {
    word: "/setup-bedrock",
    info: "Reconfigure Amazon Bedrock authentication, region, or model pins",
  },
  {
    word: "/setup-claude",
    info:
      "Guided setup — pick a role, install a plugin, try a skill, connect tools (skill)",
  },
  {
    word: "/setup-cowork",
    info:
      "Guided setup — pick a role, install a plugin, try a skill, connect tools (alias for /setup-claude) (skill)",
  },
  {
    word: "/setup-vertex",
    info:
      "Reconfigure Google Vertex AI authentication, project, region, or model pins",
  },
  {
    word: "/share",
    info: "Report a bug or share your conversation (alias for /bug)",
  },
  {
    word: "/simplify",
    info: "Clean up the changed code without changing behavior (skill)",
  },
  {
    word: "/skill-doctor",
    info: "Show which loaded skills are unused and costing context",
  },
  { word: "/skills", info: "List available skills" },
  {
    word: "/slides",
    info: "Make a new Slides deck artifact from a brief (skill)",
  },
  {
    word: "/stats",
    info:
      "Show session cost, plan usage, and activity stats (alias for /usage)",
  },
  {
    word: "/status",
    info:
      "Show Claude Code status including version, model, account, API connectivity, and tool statuses",
  },
  { word: "/statusline", info: "Set up Claude Code's status line UI" },
  { word: "/stickers", info: "Order Claude Code stickers" },
  {
    word: "/stop",
    info: "Stop this background session; transcript and worktree are kept",
  },
  {
    word: "/subtask",
    info:
      "Send a subagent off with your full context; its result comes back here",
  },
  {
    word: "/tasks",
    info: "View and manage everything running in the background",
  },
  {
    word: "/team-onboarding",
    info: "Help teammates ramp on Claude Code with a guide from your usage",
  },
  {
    word: "/teleport",
    info: "Send this session to the cloud, or resume one from claude.ai",
  },
  {
    word: "/terminal-setup",
    info: "Install Shift+Enter key binding for newlines",
  },
  { word: "/theme", info: "Change the theme" },
  {
    word: "/tp",
    info:
      "Send this session to the cloud, or resume one from claude.ai (alias for /teleport)",
  },
  { word: "/tui", info: "Set the terminal UI renderer (default | fullscreen)" },
  { word: "/ultraplan", info: "Draft an editable plan in a cloud session" },
  {
    word: "/ultrareview",
    info: "Start a cloud agent that finds and verifies bugs in your branch",
  },
  {
    word: "/undo",
    info:
      "Restore the code and/or conversation to a previous point (alias for /rewind)",
  },
  {
    word: "/update",
    info: "Restart Claude Code and keep this session (alias for /restart)",
  },
  {
    word: "/update-config",
    info: "Change settings: hooks, permissions, environment variables (skill)",
  },
  {
    word: "/upgrade",
    info: "Upgrade your plan for higher rate limits and more Opus",
  },
  { word: "/usage", info: "Show session cost, plan usage, and activity stats" },
  {
    word: "/usage-credits",
    info:
      "Configure usage credits or request them from your admin when you hit a limit",
  },
  {
    word: "/use-case",
    info: "Choose the Life Sciences use case that applies to your requests",
  },
  { word: "/verify", info: "Try your change and report if it works (skill)" },
  { word: "/voice", info: "Toggle voice mode" },
  {
    word: "/web-setup",
    info: "Set up cloud sessions with your GitHub account",
  },
  {
    word: "/workflow-authoring",
    info: "Load the reference for writing Workflow tool scripts (skill)",
  },
  { word: "/workflows", info: "Browse running and completed workflows" },
] as const satisfies Item[];
