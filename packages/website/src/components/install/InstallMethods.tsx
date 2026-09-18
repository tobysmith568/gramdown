import { useState } from "preact/hooks";
import { installCommand } from "../../lib/installCommands";
import { detectOrder, type MethodId } from "../../lib/installOrder";
import styles from "./install.module.css";
import useReveal from "./useReveal";

interface Method {
  id: MethodId;
  label: string;
}

/**
 * The "ways to run it" tabs on the docs overview page. Every id here has to
 * exist in `methods` below - see `lib/installOrder` for the OS detection
 * and ordering, shared with the homepage hero's single-command version.
 *
 * Two separate fixes stack here. The lazy `useState` initializer means
 * `detectOrder()` already has the right answer by the time this first
 * renders on the client (hydration), not a render later - no effect needed
 * to correct wrong data. But the browser still paints the server-rendered
 * fallback before that hydration JS has even run at all, which is a real,
 * separate gap `useReveal` closes: content stays invisible until mount is
 * confirmed, so only the already-correct version is ever actually seen.
 */
const InstallMethods = () => {
  const [order] = useState<MethodId[]>(() => detectOrder());
  const [activeId, setActiveId] = useState<MethodId>(order[0]);
  const revealed = useReveal();

  return (
    <div
      class={revealed ? `${styles.methods} ${styles.revealed}` : styles.methods}
      data-testid="install-methods">
      <noscript>
        <style>{`.${styles.methods} { opacity: 1 !important; }`}</style>
      </noscript>
      <div class={styles.tabs} role="tablist" aria-label="Ways to run gramdown">
        {order.map(id => {
          const method = methods.find(candidate => candidate.id === id);
          if (!method) {
            return null;
          }
          return (
            <button
              key={method.id}
              type="button"
              role="tab"
              class={styles.tab}
              aria-selected={method.id === activeId}
              onClick={() => setActiveId(method.id)}>
              {method.label}
            </button>
          );
        })}
      </div>
      <div class={styles.panel} role="tabpanel">
        {renderPanel(activeId)}
      </div>
      <p class={styles.hint}>
        Not seeing your platform, or want every option? See <a href="/docs/downloads">Downloads</a>.
      </p>
    </div>
  );
};

export default InstallMethods;

const methods: Method[] = [
  { id: "shell", label: "Shell install (Linux, macOS)" },
  { id: "binary", label: "Standalone binary" },
  { id: "npm", label: "npm" },
  { id: "brew", label: "Homebrew (macOS)" }
];

const renderPanel = (id: MethodId) => {
  switch (id) {
    case "shell":
      return (
        <>
          <pre>
            <code>{installCommand.shell.join("\n")}</code>
          </pre>
          <p>
            Verifies the download's checksum and installs to <code>~/.local/bin</code>. See{" "}
            <a href="/docs/downloads">Downloads</a> for pinning a version and other options.
          </p>
        </>
      );
    case "binary":
      return (
        <p>
          A single file that runs on its own, for Linux, macOS or Windows, with nothing else to
          install. <a href="/docs/downloads">Downloads</a> lists each one with its size.
        </p>
      );
    case "npm":
      return (
        <>
          <pre>
            <code>{installCommand.npm.join("\n")}</code>
          </pre>
          <p>Or without installing anything:</p>
          <pre>
            <code>npx gramdown draft.docx -o draft.md</code>
          </pre>
          <p>
            Every flag and exit code is in the <a href="/docs/cli">CLI reference</a>.
          </p>
        </>
      );
    case "brew":
      return (
        <>
          <pre>
            <code>{installCommand.brew.join("\n")}</code>
          </pre>
          <p>
            Installs from{" "}
            <a href="https://github.com/tobysmith568/homebrew-tap">the tobysmith568 tap</a>,
            supporting both Apple Silicon and Intel. Updates the same way as any other formula:{" "}
            <code>brew upgrade</code>.
          </p>
        </>
      );
  }
};
