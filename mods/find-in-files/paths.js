// The path filters: the "files to include" and "files to exclude" fields as rg globs.

const GLOB_CHARS = /[*?[{]/;

/** Returns the rg flags for both fields; the excludes come last, so they win over an include. */
export const pathFlags = ({ include, exclude }) => {
  const includes = parsePatterns(include);
  const excludes = parsePatterns(exclude).map((glob) => `!${glob}`);
  return [...includes, ...excludes].flatMap((glob) => ["--glob", glob]);
};

/** Returns the globs of one field: one or two per comma-separated part. */
export const parsePatterns = (text) => {
  return splitParts(text)
    .map((part) => part.trim().replace(/^\.\//, ""))
    .filter(Boolean)
    .flatMap(expand);
};

// Splits on the commas outside braces, so `*.{js,ts}` stays one part.
const splitParts = (text) => {
  const parts = [""];
  let depth = 0;

  // Not a regex: braces nest, and a lookahead cannot count them.
  for (const char of text) {
    if (char === "," && depth === 0) {
      parts.push("");
      continue;
    }

    if (char === "{") depth++;
    if (char === "}") depth = Math.max(0, depth - 1);
    parts[parts.length - 1] += char;
  }

  return parts;
};

// A plain name is a file or a folder. rg anchors a glob with a `/` to the root, so a name
// without one must also match as a folder at any depth. rg matches nothing for a trailing `/`.
const expand = (part) => {
  if (GLOB_CHARS.test(part)) return [part];

  const name = part.replace(/\/+$/, "");
  if (!name) return [];
  return name.includes("/") ? [name, `${name}/**`] : [name, `**/${name}/**`];
};
