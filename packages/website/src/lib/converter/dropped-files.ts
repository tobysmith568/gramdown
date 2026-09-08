/**
 * Sorting a drop / file-pick into the `.docx` files the converter will take and
 * the count it quietly skipped, plus the one-line note shown for the skips.
 * Split out of `store.ts` so the (extension-only) filtering and the pluralised
 * message can be tested without the queue.
 */

export interface PartitionedFiles {
  /** The files whose name ends in `.docx` (case-insensitive), drop order kept. */
  docx: File[];
  /** How many of the input files were not `.docx`. */
  rejectedCount: number;
}

/** Split `files` into the `.docx` ones and a count of everything else. */
export const partitionDocxFiles = (files: readonly File[]): PartitionedFiles => {
  const docx = files.filter(file => file.name.toLowerCase().endsWith(".docx"));
  return { docx, rejectedCount: files.length - docx.length };
};

/** The transient "Skipped N files…" note, or `null` when nothing was skipped. */
export const describeRejection = (count: number): string | null => {
  if (count === 0) {
    return null;
  }
  if (count === 1) {
    return "Skipped 1 file that isn’t a .docx.";
  }
  return `Skipped ${count} files that aren’t .docx.`;
};
