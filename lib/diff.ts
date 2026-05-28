/**
 * Tiny line-level unified-diff implementation. No deps.
 *
 * Approach: compute an LCS table over the two line arrays, walk it from the
 * bottom-right to emit a sequence of keep/add/delete tokens, then group
 * runs of changes plus N lines of surrounding context into hunks.
 *
 * This is O(N*M) memory and time — fine for code files (~thousands of
 * lines), unsuitable for multi-megabyte blobs. Callers should cap input
 * size before calling.
 */

export type DiffLineKind = " " | "+" | "-";

export type DiffLine = {
  kind: DiffLineKind;
  baseLine: number | null; // 1-based line number in the base file
  headLine: number | null; // 1-based line number in the head file
  text: string;
};

export type DiffHunk = {
  baseStart: number;
  baseCount: number;
  headStart: number;
  headCount: number;
  lines: DiffLine[];
};

const MAX_LINES = 10_000;

function splitLines(s: string): string[] {
  // Preserve trailing-newline semantics by always splitting on \n. An empty
  // string -> one empty line. We trim the trailing empty if present so a
  // standard "ends with newline" file doesn't show a phantom blank line.
  if (s === "") return [];
  const out = s.split("\n");
  if (out[out.length - 1] === "") out.pop();
  return out;
}

/**
 * Compute the full token stream (no hunking). Used internally; callers
 * usually want diffHunks.
 */
function fullDiff(a: string[], b: string[]): DiffLine[] {
  const n = a.length, m = b.length;
  // LCS table (n+1) x (m+1)
  const table: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0)
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[i] === b[j]) table[i][j] = table[i + 1][j + 1] + 1;
      else table[i][j] = Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  // Walk
  const out: DiffLine[] = [];
  let i = 0, j = 0;
  let baseLine = 1, headLine = 1;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ kind: " ", baseLine: baseLine++, headLine: headLine++, text: a[i] });
      i++; j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      out.push({ kind: "-", baseLine: baseLine++, headLine: null, text: a[i] });
      i++;
    } else {
      out.push({ kind: "+", baseLine: null, headLine: headLine++, text: b[j] });
      j++;
    }
  }
  while (i < n) {
    out.push({ kind: "-", baseLine: baseLine++, headLine: null, text: a[i++] });
  }
  while (j < m) {
    out.push({ kind: "+", baseLine: null, headLine: headLine++, text: b[j++] });
  }
  return out;
}

/**
 * Group changes into hunks with `context` lines of surrounding ` ` context.
 */
function buildHunks(stream: DiffLine[], context = 3): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let i = 0;
  while (i < stream.length) {
    // Find next change
    let ci = i;
    while (ci < stream.length && stream[ci].kind === " ") ci++;
    if (ci >= stream.length) break;

    // Start of hunk: context lines before the change
    const start = Math.max(0, ci - context);

    // Find end of contiguous change region (with up to 2*context same-kind gap merged)
    let ce = ci;
    while (ce < stream.length) {
      if (stream[ce].kind !== " ") {
        ce++;
        continue;
      }
      // Look ahead — if next change is within 2*context space-runs, keep going
      let lookahead = ce;
      let spaces = 0;
      while (lookahead < stream.length && stream[lookahead].kind === " ") {
        spaces++;
        lookahead++;
      }
      if (lookahead < stream.length && spaces <= 2 * context) {
        ce = lookahead;
      } else {
        break;
      }
    }
    const end = Math.min(stream.length, ce + context);

    const lines = stream.slice(start, end);
    let baseStart = 0, baseCount = 0, headStart = 0, headCount = 0;
    for (const l of lines) {
      if (l.kind !== "+") {
        baseCount++;
        if (baseStart === 0 && l.baseLine !== null) baseStart = l.baseLine;
      }
      if (l.kind !== "-") {
        headCount++;
        if (headStart === 0 && l.headLine !== null) headStart = l.headLine;
      }
    }
    hunks.push({ baseStart, baseCount, headStart, headCount, lines });
    i = end;
  }
  return hunks;
}

export type DiffResult =
  | { kind: "ok"; hunks: DiffHunk[]; truncated: false }
  | { kind: "binary" }
  | { kind: "too-large"; baseLines: number; headLines: number };

/**
 * Top-level: produce a hunked unified diff between two strings.
 * Returns 'binary' if either side has a NUL byte, 'too-large' if either
 * side exceeds MAX_LINES.
 */
export function diffStrings(
  baseText: string | null,
  headText: string | null,
  options: { context?: number } = {}
): DiffResult {
  const a = baseText ?? "";
  const b = headText ?? "";
  if (a.indexOf("\0") >= 0 || b.indexOf("\0") >= 0) return { kind: "binary" };
  const aLines = splitLines(a);
  const bLines = splitLines(b);
  if (aLines.length > MAX_LINES || bLines.length > MAX_LINES) {
    return { kind: "too-large", baseLines: aLines.length, headLines: bLines.length };
  }
  const stream = fullDiff(aLines, bLines);
  return {
    kind: "ok",
    hunks: buildHunks(stream, options.context ?? 3),
    truncated: false,
  };
}
