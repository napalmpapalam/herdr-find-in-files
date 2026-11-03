// Lines cut for display: the part in view, with its marks moved to match.

/** The most characters of a line that a row or the preview draws. */
export const WIDTH = 300;

// A first match further in than LEAD shows the line from LEAD_BEFORE characters before it.
const LEAD = 60;
const LEAD_BEFORE = 20;
const ELLIPSIS = "…";
const TAB = "    ";
// UTF-16 units in this range are the second half of a surrogate pair.
const LOW_SURROGATE_FIRST = 0xdc00;
const LOW_SURROGATE_LAST = 0xdfff;

/** Returns a file's lines, without the empty one after a last newline. */
export const fileLines = (text) => {
  const lines = text.split("\n").map((line) => line.replace(/\r$/, ""));
  if (text.endsWith("\n")) lines.pop();
  return lines;
};

/** Returns the column to start a line at so that its first match is in view. */
export const startColumn = (text, ranges, from = 0) => {
  const first = ranges[0]?.start ?? 0;
  if (first - from <= LEAD) return from;

  return outsidePair(text, first - LEAD_BEFORE);
};

/** Returns the `width` characters of `text` from `start`, with `ranges` moved to match. */
export const clip = (text, ranges, start, width = WIDTH) => {
  const end = outsidePair(text, Math.min(text.length, start + width));
  const move = (i) => Math.min(Math.max(i, start), end) - start;
  const inView = ranges.filter((r) => r.end > start && r.start < end);
  return { text: text.slice(start, end), ranges: inView.map((r) => moveRange(r, move)) };
};

/** Returns a hit's line for its row: no indent, and "…" before a far match. */
export const excerpt = (hit) => {
  const indent = hit.text.length - hit.text.trimStart().length;
  const start = startColumn(hit.text, hit.ranges, indent);
  const part = clip(hit.text, hit.ranges, start);
  if (start === indent) return part;

  const ranges = part.ranges.map((r) => moveRange(r, (i) => i + ELLIPSIS.length));
  return { text: ELLIPSIS + part.text, ranges };
};

/** Returns `text` as { text, mark } parts; `ranges` are sorted and apart. */
export const spans = (text, ranges) => {
  const parts = ranges.flatMap((r, k) => [
    { text: text.slice(ranges[k - 1]?.end ?? 0, r.start), mark: false },
    { text: text.slice(r.start, r.end), mark: true },
  ]);
  const tail = { text: text.slice(ranges.at(-1)?.end ?? 0), mark: false };
  return [...parts, tail].filter((part) => part.text);
};

export const expandTabs = (text) => text.replace(/\t/g, TAB);

// A cut between the two halves of a surrogate pair would draw a broken character.
const outsidePair = (text, i) => (isLowSurrogate(text.charCodeAt(i)) ? i - 1 : i);

const isLowSurrogate = (code) => code >= LOW_SURROGATE_FIRST && code <= LOW_SURROGATE_LAST;

const moveRange = (range, move) => ({ start: move(range.start), end: move(range.end) });
