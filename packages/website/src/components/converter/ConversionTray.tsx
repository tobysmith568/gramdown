import { useEffect, useState } from "preact/hooks";
import { autoDownload, setAutoDownload } from "../../lib/converter/preferences";
import {
  clearConversions,
  conversions,
  downloadAllAsZip,
  downloadConversion,
  enqueueFiles,
  lastRejection,
  removeConversion,
  type Conversion
} from "../../lib/converter/store";
import styles from "./converter.module.css";

/**
 * The docked panel that lists every conversion and its state, and carries the
 * always-visible `<input type="file">` fallback for people who can't (or don't
 * want to) drag. Mounted site-wide from `BaseLayout` alongside `DropOverlay`.
 */
const ConversionTray = () => {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const items = conversions.value;
  const rejection = lastRejection.value;

  const convertingCount = items.filter(item => item.status === "converting").length;
  const readyItems = items.filter(item => item.status === "ready");

  useEffect(() => {
    if (items.length > 0) {
      setOpen(true);
    }
  }, [items.length]);

  const onPick = (event: Event): void => {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement) || !input.files || input.files.length === 0) {
      return;
    }
    const files = Array.from(input.files);
    void enqueueFiles(files);
    input.value = "";
  };

  const onCopy = async (item: Conversion): Promise<void> => {
    if (item.markdown === null) {
      return;
    }
    await navigator.clipboard.writeText(item.markdown);
    setCopiedId(item.id);
    window.setTimeout(() => {
      setCopiedId(current => (current === item.id ? null : current));
    }, 1500);
  };

  if (!open) {
    return (
      <button type="button" class={styles.fab} onClick={() => setOpen(true)}>
        Convert a <code>.docx</code>
        {items.length > 0 && <span class={styles.fabBadge}>{items.length}</span>}
      </button>
    );
  }

  return (
    <section class={styles.tray} aria-label="Conversions">
      <header class={styles.trayBar}>
        <strong class={styles.trayTitle}>Conversions</strong>
        <div class={styles.trayBarActions}>
          {readyItems.length > 1 && (
            <button type="button" onClick={() => void downloadAllAsZip()}>
              Download all (.zip)
            </button>
          )}
          {items.length > 0 && (
            <button type="button" onClick={() => clearConversions()}>
              Clear all
            </button>
          )}
          <button
            type="button"
            class={styles.trayCollapse}
            aria-label="Collapse"
            onClick={() => setOpen(false)}>
            ▾
          </button>
        </div>
      </header>

      <p class="sr-only" role="status" aria-live="polite">
        {describeProgress(convertingCount, readyItems.length)}
      </p>

      {rejection !== null && <p class={styles.trayNote}>{rejection}</p>}

      {items.length === 0 ? (
        <p class={styles.trayEmpty}>
          Drop a Grammarly <code>.docx</code> anywhere on the page, or pick one below.
        </p>
      ) : (
        <ul class={styles.trayList}>
          {items.map(item => (
            <li key={item.id} class={styles.row} data-status={item.status}>
              <div class={styles.rowHead}>
                <span class={styles.rowName} title={item.sourceName}>
                  {item.outputName}
                </span>
                <span class={styles.rowSize}>{formatSize(item.sizeBytes)}</span>
              </div>

              {item.status === "converting" && <p class={styles.rowState}>Converting…</p>}

              {item.status === "error" && (
                <p class={`${styles.rowState} ${styles.rowStateError}`}>{item.error}</p>
              )}

              {item.status === "ready" && item.warnings.length > 0 && (
                <details class={styles.rowWarnings}>
                  <summary>{formatWarningCount(item.warnings.length)}</summary>
                  <ul>
                    {item.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </details>
              )}

              <div class={styles.rowActions}>
                {item.status === "ready" && (
                  <>
                    <button type="button" onClick={() => downloadConversion(item.id)}>
                      Download
                    </button>
                    <button type="button" onClick={() => void onCopy(item)}>
                      {copiedId === item.id ? "Copied" : "Copy"}
                    </button>
                  </>
                )}
                <button type="button" onClick={() => removeConversion(item.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label class={styles.trayAdd}>
        <span>Add .docx files</span>
        <input type="file" accept=".docx" multiple onChange={onPick} />
      </label>

      <label class={styles.trayPref}>
        <input
          type="checkbox"
          checked={autoDownload.value}
          onChange={event => setAutoDownload((event.currentTarget as HTMLInputElement).checked)}
        />
        <span>Download automatically when ready</span>
      </label>
    </section>
  );
};

export default ConversionTray;

const describeProgress = (convertingCount: number, readyCount: number): string => {
  if (convertingCount > 0) {
    return `Converting ${convertingCount} ${convertingCount === 1 ? "file" : "files"}`;
  }
  if (readyCount > 0) {
    return `${readyCount} ${readyCount === 1 ? "file" : "files"} ready to download`;
  }
  return "";
};

const formatWarningCount = (count: number): string => {
  return `${count} ${count === 1 ? "warning" : "warnings"}`;
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kib = bytes / 1024;
  if (kib < 1024) {
    return `${kib.toFixed(kib < 10 ? 1 : 0)} KB`;
  }
  const mib = kib / 1024;
  return `${mib.toFixed(1)} MB`;
};
