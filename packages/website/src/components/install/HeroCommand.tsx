import { useState } from "preact/hooks";
import { installCommand, type CommandMethodId } from "../../lib/installCommands";
import { detectOrder, type MethodId } from "../../lib/installOrder";
import styles from "./hero-command.module.css";
import useReveal from "./useReveal";

/**
 * The homepage hero's single command, picked from the same OS-detected
 * order as the docs page's `InstallMethods` tabs - just narrowed to the one
 * highest-priority method that actually has a one-liner ("binary" never
 * does, and never sorts first anyway; see `lib/installOrder`).
 *
 * Two separate fixes stack here. The lazy `useState` initializer means
 * `detectOrder()` already has the right answer by the time this first
 * renders on the client (hydration), not a render later - no effect needed
 * to correct wrong data. But the browser still paints the server-rendered
 * fallback before that hydration JS has even run at all, which is a real,
 * separate gap `useReveal` closes: content stays invisible until mount is
 * confirmed, so only the already-correct version is ever actually seen.
 */
const HeroCommand = () => {
  const [id] = useState<CommandMethodId>(() => pickHeroId(detectOrder()));
  const revealed = useReveal();

  return (
    <div
      class={revealed ? `${styles.wrap} ${styles.revealed}` : styles.wrap}
      data-testid="hero-command">
      <noscript>
        <style>{`.${styles.wrap} { opacity: 1 !important; }`}</style>
      </noscript>
      <div class={styles.cmd}>
        {installCommand[id].map(line => (
          <code class={styles.cmdLine}>{line}</code>
        ))}
      </div>
      <p class={styles.cmdNote}>
        See <a href="/docs/downloads">Downloads</a> for every install option.
      </p>
    </div>
  );
};

export default HeroCommand;

const isCommandMethod = (id: MethodId): id is CommandMethodId => id in installCommand;

const pickHeroId = (order: MethodId[]): CommandMethodId => order.find(isCommandMethod) ?? "shell";
