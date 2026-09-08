import styles from "./converter.module.css";

/**
 * A quiet, non-interactive line in the bottom-right corner of every page,
 * pointing out that the drag-and-drop converter works site-wide (a drop is
 * caught by `DropOverlay`, wherever you are). It carries no state and nothing
 * to click - the converter's real UI is the editor panel on the index
 * (`ConverterPanel`), which is also the accessible entry point. Hidden on
 * mobile, where there is no cursor to drag with. Replaces the old counter FAB.
 */
const DropHint = () => {
  return (
    <p class={styles.pageHint} aria-hidden="true">
      Drop a .docx anywhere on
      <br />
      this page to convert it to Markdown
    </p>
  );
};

export default DropHint;
