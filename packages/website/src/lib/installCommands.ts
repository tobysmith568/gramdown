import type { MethodId } from "./installOrder";

export type CommandMethodId = Exclude<MethodId, "binary">;

/**
 * The install-then-run command pair for each method that actually has one
 * ("binary" doesn't - it's "download a file and run it," not a one-liner).
 * Shared by the homepage hero (shows just this) and the docs page's
 * `InstallMethods` tabs (shows this plus explanatory prose per method), so
 * the commands themselves can't drift out of sync between the two.
 */
export const installCommand: Record<CommandMethodId, [string, string]> = {
  shell: [
    "curl -fsSL https://gramdown.tobythe.dev/install.sh | sh",
    "gramdown draft.docx -o draft.md"
  ],
  npm: ["npm install -g gramdown", "gramdown draft.docx -o draft.md"],
  brew: ["brew install tobysmith568/tap/gramdown", "gramdown draft.docx -o draft.md"]
};
