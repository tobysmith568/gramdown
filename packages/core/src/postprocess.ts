const FENCE_RE = /^(`{3,})/;

/**
 * At most one blank line between blocks, no trailing whitespace, exactly one
 * newline at the end.
 *
 * Code blocks are left exactly as they are: their blank lines and trailing
 * whitespace are part of the code. A fence is only closed by a delimiter at
 * least as long as the one that opened it, so a listing that itself contains
 * backticks does not end the block early.
 */
export const normaliseBlankLines = (markdown: string): string => {
  const output: string[] = [];
  let openFence: string | undefined;

  for (const line of markdown.split("\n")) {
    const fence = FENCE_RE.exec(line)?.[1];

    if (openFence === undefined) {
      if (fence) openFence = fence;
    } else if (fence && fence.length >= openFence.length && line.trim() === fence) {
      openFence = undefined;
    }

    if (openFence !== undefined || fence) {
      output.push(line);
      continue;
    }

    const trimmed = line.replace(/[ \t]+$/, "");
    if (trimmed === "" && output.at(-1) === "") continue;
    output.push(trimmed);
  }

  return `${output.join("\n").trim()}\n`;
};

export const postprocess = (markdown: string): string => normaliseBlankLines(markdown);
