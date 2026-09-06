import {
  conversions,
  downloadConversion,
  enqueueFiles,
  lastRejection,
  type Conversion
} from "../../lib/converter/store";
import styles from "./converter.module.css";

/**
 * The index-page hero dropzone — the primary, in-flow entry point for a
 * conversion. The site-wide `DropOverlay` + `ConversionTray` (mounted from
 * `BaseLayout`) still own drag-and-drop on every page and the persistent
 * queue; this island shares their queue signal, so a file picked here shows
 * up in both places. It only handles the click-to-pick path — an actual drag
 * is caught by the full-page overlay, which sits above the hero anyway.
 */
const HeroDropzone = () => {
  const items = conversions.value;
  const rejection = lastRejection.value;

  const onPick = (event: Event): void => {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement) || !input.files || input.files.length === 0) {
      return;
    }
    const files = Array.from(input.files);
    void enqueueFiles(files);
    input.value = "";
  };

  return (
    <div class={styles.hero}>
      <label class={styles.heroZone}>
        <input type="file" accept=".docx" multiple onChange={onPick} class="sr-only" />
        <span class={styles.heroZoneTitle}>
          Drop a Grammarly <code>.docx</code> here
        </span>
        <span class={styles.heroZoneHint}>or click to choose files — nothing is uploaded</span>
      </label>

      {rejection !== null && <p class={styles.heroNote}>{rejection}</p>}

      {items.length > 0 && (
        <ul class={styles.heroResults}>
          {items.map(item => (
            <li key={item.id} class={styles.heroResult} data-status={item.status}>
              <span class={styles.heroResultName}>{item.outputName}</span>
              {renderState(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HeroDropzone;

const renderState = (item: Conversion) => {
  if (item.status === "converting") {
    return <span class={styles.heroResultState}>Converting…</span>;
  }
  if (item.status === "error") {
    return <span class={`${styles.heroResultState} ${styles.rowStateError}`}>{item.error}</span>;
  }
  return (
    <button type="button" onClick={() => downloadConversion(item.id)}>
      Download
    </button>
  );
};
