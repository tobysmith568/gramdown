import { useEffect, useRef, useState } from "preact/hooks";
import { enqueueFiles } from "../../lib/converter/store";
import styles from "./converter.module.css";

/**
 * A full-viewport scrim shown while a file is dragged anywhere over the page.
 * Mounted once, site-wide, from `BaseLayout` — drag-and-drop works on every
 * page, not just the index. The visible `<input>` fallback lives in the tray.
 */
const DropOverlay = () => {
  const [active, setActive] = useState(false);
  const dragDepth = useRef(0);

  useEffect(() => {
    const carriesFiles = (event: DragEvent): boolean => {
      const types = event.dataTransfer?.types;
      if (!types) {
        return false;
      }
      const typeList = Array.from(types);
      return typeList.includes("Files");
    };

    const onDragEnter = (event: DragEvent): void => {
      if (!carriesFiles(event)) {
        return;
      }
      event.preventDefault();
      dragDepth.current += 1;
      setActive(true);
    };

    const onDragOver = (event: DragEvent): void => {
      if (!carriesFiles(event)) {
        return;
      }
      // Required for `drop` to fire, and it suppresses the browser's own
      // "open this file" behaviour when the drop misses everything.
      event.preventDefault();
    };

    const onDragLeave = (event: DragEvent): void => {
      if (!carriesFiles(event)) {
        return;
      }
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) {
        setActive(false);
      }
    };

    const onDrop = (event: DragEvent): void => {
      event.preventDefault();
      dragDepth.current = 0;
      setActive(false);

      const dropped = event.dataTransfer?.files;
      if (!dropped || dropped.length === 0) {
        return;
      }
      const files = Array.from(dropped);
      void enqueueFiles(files);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);

    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  if (!active) {
    return null;
  }

  return (
    <div class={styles.scrim} role="presentation">
      <div class={styles.scrimCard}>
        <p class={styles.scrimTitle}>Drop to convert</p>
        <p class={styles.scrimHint}>
          Grammarly <code>.docx</code> exports become Markdown right here in your browser
        </p>
      </div>
    </div>
  );
};

export default DropOverlay;
