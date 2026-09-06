import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { downloadMarkdown } from "../../lib/converter/download";
import { guessLanguages } from "../../lib/converter/preferences";
import type { SampleConversion } from "../../lib/converter/sample";
import {
  conversions,
  downloadAllAsZip,
  downloadConversion,
  enqueueFiles,
  hydrated,
  lastRejection,
  removeConversion,
  updateGuessLanguages,
  type Conversion
} from "../../lib/converter/store";
import styles from "./converter.module.css";

interface Props {
  /** The build-time worked example, shown until the visitor drops a file. */
  sample: SampleConversion;
}

const sampleId = "__sample__";

/**
 * The index-page converter, styled as a small embedded editor: an explorer of
 * converted files on the left, the selected file's Markdown (with the syntax
 * dimmed) on the right, and a status bar underneath. It shares the site-wide
 * queue signal from `lib/converter/store`, so a file dropped anywhere on the
 * page - caught by `DropOverlay` - shows up here too.
 *
 * A baked-in worked example is always pinned to the bottom of the list so a
 * cold visitor sees real converter output without doing anything.
 */
const ConverterPanel = ({ sample }: Props) => {
  const queue = conversions.value;
  const rejection = lastRejection.value;
  const guessing = guessLanguages.value;

  const [selectedId, setSelectedId] = useState<string>(sampleId);
  const rootRef = useRef<HTMLDivElement>(null);
  const seenCount = useRef(queue.length);
  const mountedAt = useRef(performance.now());

  // Hold the editor back until the saved queue has loaded, so a persisted file
  // doesn't flash in a beat after the sample. The timeout is a safety net for
  // the case where the persistence island never reports in.
  const [waitedTooLong, setWaitedTooLong] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setWaitedTooLong(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);
  const ready = hydrated.value || waitedTooLong;

  // Select the newest file as it arrives. Scroll to it too - but not for the
  // queue that rehydrates from storage in the first moment after mount (that
  // would yank the page on load); only for a genuine drop while the visitor is
  // here.
  useEffect(() => {
    if (queue.length > seenCount.current) {
      const newest = queue[queue.length - 1];
      if (newest) {
        setSelectedId(newest.id);
        if (performance.now() - mountedAt.current > 1500) {
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          rootRef.current?.scrollIntoView({
            behavior: reduce ? "auto" : "smooth",
            block: "center"
          });
        }
      }
    }
    seenCount.current = queue.length;
  }, [queue]);

  // Fall back to the example if the selected file was removed.
  useEffect(() => {
    if (selectedId === sampleId) {
      return;
    }
    const stillHere = queue.some(item => item.id === selectedId);
    if (!stillHere) {
      const last = queue[queue.length - 1];
      setSelectedId(last ? last.id : sampleId);
    }
  }, [queue, selectedId]);

  // The sample tracks the "guess code languages" toggle too - both variants are
  // produced at build time (see lib/converter/sample.ts).
  const sampleMarkdown = guessing ? sample.markdownGuessed : sample.markdown;

  const sampleItem: Conversion = useMemo(
    () => ({
      id: sampleId,
      sourceName: sample.sourceName,
      outputName: sample.outputName,
      sizeBytes: 0,
      status: "ready",
      markdown: sampleMarkdown,
      warnings: [],
      error: null,
      sourceBytes: new Uint8Array(),
      langGuessed: guessing,
      createdAt: 0
    }),
    [sample, sampleMarkdown, guessing]
  );

  const selected =
    selectedId === sampleId ? sampleItem : (queue.find(i => i.id === selectedId) ?? sampleItem);

  const lines = useMemo(
    () => (selected.markdown === null ? [] : dimMarkdown(selected.markdown)),
    [selected.markdown]
  );

  const readyCount = queue.filter(item => item.status === "ready").length;

  const [copied, setCopied] = useState(false);

  // Announce progress for screen readers - the pane shows it visually, but a
  // drop otherwise moves the selection and lands silently.
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    if (selected.id === sampleId) {
      return;
    }
    if (selected.status === "converting") {
      setAnnouncement(`Converting ${selected.sourceName}`);
    } else if (selected.status === "error") {
      setAnnouncement(`${selected.sourceName} could not be converted`);
    } else if (selected.status === "ready" && selected.markdown !== null) {
      const lineCount = countLines(selected.markdown);
      setAnnouncement(`${selected.outputName} ready: ${lineCount} lines of Markdown`);
    }
  }, [selected.id, selected.status, selected.markdown, selected.sourceName, selected.outputName]);

  const onCopy = async (): Promise<void> => {
    if (selected.markdown === null) {
      return;
    }
    await navigator.clipboard.writeText(selected.markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const onPick = (event: Event): void => {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement) || !input.files || input.files.length === 0) {
      return;
    }
    const files = Array.from(input.files);
    void enqueueFiles(files);
    input.value = "";
  };

  if (!ready) {
    return (
      <div class={styles.editorLoading}>
        <span>Loading the converter…</span>
      </div>
    );
  }

  return (
    <div class={styles.editor} ref={rootRef}>
      <p class="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <div class={styles.explorer}>
        <p class={styles.explorerHead}>Converted files</p>

        <ul class={styles.efList}>
          {queue.map(item => (
            <FileRow
              key={item.id}
              item={item}
              selected={item.id === selectedId}
              onSelect={() => setSelectedId(item.id)}
              onRemove={() => removeConversion(item.id)}
            />
          ))}
          <FileRow
            item={sampleItem}
            example
            selected={selectedId === sampleId}
            onSelect={() => setSelectedId(sampleId)}
          />
        </ul>

        <label class={styles.drop}>
          <input type="file" accept=".docx" multiple onChange={onPick} class="sr-only" />
          <span class={styles.dropTitle}>
            Drop a <code>.docx</code>
          </span>
          <span class={styles.dropHint}>or choose a file</span>
        </label>

        {rejection !== null && <p class={styles.efNote}>{rejection}</p>}

        <div class={styles.efTools}>
          <label class={styles.efToggle}>
            <input
              type="checkbox"
              checked={guessing}
              onChange={event =>
                updateGuessLanguages((event.currentTarget as HTMLInputElement).checked)
              }
            />
            <span>Guess code languages</span>
          </label>
          {readyCount > 1 && (
            <button type="button" class={styles.efZip} onClick={() => void downloadAllAsZip()}>
              Download all ({readyCount}) as .zip
            </button>
          )}
        </div>
      </div>

      <div class={styles.pane}>
        <div class={styles.paneHead}>
          <span class={styles.paneFile}>{selected.outputName}</span>
          <span class={styles.paneActions}>
            <button
              type="button"
              disabled={selected.markdown === null}
              onClick={() => void onCopy()}>
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              disabled={selected.markdown === null}
              onClick={() => downloadSelected(selected)}>
              Download
            </button>
          </span>
        </div>

        {selected.status === "converting" && (
          <p class={styles.paneState}>Converting {selected.outputName}…</p>
        )}

        {selected.status === "error" && (
          <p class={`${styles.paneState} ${styles.paneStateError}`}>
            {selected.error ?? "That file could not be converted."}
          </p>
        )}

        {selected.status === "ready" && selected.markdown !== null && (
          <div class={styles.code}>
            {lines.map((html, index) => (
              <div key={index} class={styles.ln}>
                <span class={styles.lnNo} aria-hidden="true">
                  {index + 1}
                </span>
                <span class={styles.lnText} dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            ))}
          </div>
        )}

        <div class={styles.statusbar}>
          <span>Markdown</span>
          {selected.markdown !== null && <span>{countLines(selected.markdown)} lines</span>}
          <span class={styles.statusGrow} />
          <span class={styles.statusOk}>converted locally, nothing uploaded</span>
        </div>
      </div>
    </div>
  );
};

export default ConverterPanel;

interface FileRowProps {
  item: Conversion;
  selected: boolean;
  example?: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}

const FileRow = ({ item, selected, example, onSelect, onRemove }: FileRowProps) => {
  return (
    <li class={styles.ef} data-status={item.status} data-selected={selected ? "" : undefined}>
      <button type="button" class={styles.efMain} onClick={onSelect}>
        <span class={styles.efName}>{item.outputName}</span>
        <span class={styles.efMeta}>
          {item.status === "converting"
            ? "converting…"
            : item.status === "error"
              ? "failed"
              : item.sourceName}
        </span>
      </button>
      <span class={styles.efIcons}>
        {item.markdown !== null && (
          <button
            type="button"
            aria-label={`Download ${item.outputName}`}
            onClick={() => downloadSelected(item)}>
            <IconDownload />
          </button>
        )}
        {!example && onRemove && (
          <button type="button" aria-label={`Remove ${item.outputName}`} onClick={onRemove}>
            <IconTrash />
          </button>
        )}
      </span>
    </li>
  );
};

const IconDownload = () => (
  <svg
    class={styles.icon}
    viewBox="0 0 16 16"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true">
    <path d="M8 2v8.5m0 0 3.25-3.25M8 10.5 4.75 7.25M2.5 13.5h11" />
  </svg>
);

const IconTrash = () => (
  <svg
    class={styles.icon}
    viewBox="0 0 16 16"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true">
    <path d="M2.75 4.25h10.5M6 4V2.75h4V4M4 4.25l.6 9.25a1 1 0 0 0 1 .95h4.8a1 1 0 0 0 1-.95L12 4.25M6.5 7v4.5M9.5 7v4.5" />
  </svg>
);

const escapeHtml = (raw: string): string =>
  raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const dimInline = (escaped: string): string => {
  let text = escaped;
  text = text.replace(/^(\s*)(#{1,6} )/, '$1<span class="mk">$2</span>');
  text = text.replace(/^(\s*)([-*] )/, '$1<span class="mk">$2</span>');
  text = text.replace(/^(\s*)(\d+\. )/, '$1<span class="mk">$2</span>');
  text = text.replace(/^(\s*)(&gt; ?)/, '$1<span class="mk">$2</span>');
  text = text.replace(/\*\*/g, '<span class="mk">**</span>');
  text = text.replace(/`([^`]+)`/g, '<span class="mk">`</span>$1<span class="mk">`</span>');
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<span class="mk">[</span>$1<span class="mk">](</span>$2<span class="mk">)</span>'
  );
  return text;
};

/** One HTML string per source line, with the Markdown punctuation wrapped in `.mk`. */
const dimMarkdown = (markdown: string): string[] => {
  const rows = markdown.replace(/\n$/, "").split("\n");
  const out: string[] = [];
  let inFence = false;

  for (const raw of rows) {
    const escaped = escapeHtml(raw);
    if (/^\s*```/.test(raw)) {
      out.push(`<span class="mk">${escaped}</span>` || "&nbsp;");
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      out.push(escaped || "&nbsp;");
      continue;
    }
    out.push(dimInline(escaped) || "&nbsp;");
  }

  return out;
};

const countLines = (markdown: string): number => markdown.replace(/\n$/, "").split("\n").length;

const downloadSelected = (item: Conversion): void => {
  if (item.markdown === null) {
    return;
  }
  if (item.id === sampleId) {
    downloadMarkdown(item.outputName, item.markdown);
    return;
  }
  downloadConversion(item.id);
};
