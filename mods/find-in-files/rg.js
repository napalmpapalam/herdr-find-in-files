// ripgrep: the search command and its JSON output.

export const MAX_HITS = 1000;

const MATCH_PREFIX = '{"type":"match"';

// The first code points that take 2 and 3 UTF-8 bytes. An astral one, past the Basic
// Multilingual Plane, takes 4 bytes and 2 UTF-16 units.
const FIRST_TWO_BYTE = 0x80;
const FIRST_THREE_BYTE = 0x800;
const FIRST_ASTRAL = 0x10000;

// grep closes the pipe one match after the cap, which stops rg and keeps the output under
// exec's 8 MiB. The extra match tells the list that there are more.
export const SEARCH_SCRIPT = `rg --json --fixed-strings --smart-case "$@" | grep -m ${MAX_HITS + 1} '^${MATCH_PREFIX}'`;

/** Returns one hit per matching line, sorted by path, then line; `hasMore` when over `max`. */
export const parseHits = (stdout, max = MAX_HITS) => {
  const rows = stdout.split("\n").filter((row) => row.startsWith(MATCH_PREFIX));
  const hits = rows.slice(0, max).flatMap(parseRow);
  hits.sort(byPathThenLine);
  return { hits, hasMore: rows.length > max };
};

/** Returns the line of rg's stderr to show: the reason of a bad regex, else the first line. */
export const errorText = (stderr) => {
  const lines = stderr.trim().split("\n");
  // A regex error starts with "rg: regex parse error:" and gives the reason on a later line.
  return lines.find((line) => line.startsWith("error:")) ?? (lines[0] || null);
};

/** Returns a path as people read it, without rg's "./". */
export const displayPath = (path) => path.replace(/^\.\//, "");

// A row that rg's output cut off, or a non-UTF-8 name or line (rg sends base64), gives no hit.
const parseRow = (row) => {
  const parsed = parseJson(row);
  if (parsed instanceof SyntaxError) return [];

  const { path, lines, line_number: line, submatches } = parsed.data;
  if (path.text === undefined || lines.text === undefined) return [];

  const at = indexesOfBytes(
    lines.text,
    submatches.flatMap((m) => [m.start, m.end]),
  );
  const ranges = submatches.map((_m, k) => ({ start: at[2 * k], end: at[2 * k + 1] }));
  return [{ path: path.text, line, text: lines.text.replace(/\r?\n$/, ""), ranges }];
};

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    if (!(e instanceof SyntaxError)) throw e;
    return e;
  }
};

// rg searches files in parallel, so its own order changes from run to run.
const byPathThenLine = (a, b) => {
  if (a.path !== b.path) return a.path < b.path ? -1 : 1;
  return a.line - b.line;
};

// rg reports UTF-8 byte offsets; JS strings index UTF-16 units. One pass for a line's sorted offsets.
const indexesOfBytes = (text, offsets) => {
  let bytes = 0;
  let i = 0;

  return offsets.map((byte) => {
    while (i < text.length && bytes < byte) {
      const code = text.codePointAt(i);
      bytes += utf8Length(code);
      i += code < FIRST_ASTRAL ? 1 : 2;
    }

    return i;
  });
};

const utf8Length = (code) => {
  if (code < FIRST_TWO_BYTE) return 1;
  if (code < FIRST_THREE_BYTE) return 2;
  return code < FIRST_ASTRAL ? 3 : 4;
};
