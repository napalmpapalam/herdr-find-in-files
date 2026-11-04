// Syntax tokens of a line, as ranges ({ start, end, cls }) that lines.js cuts like the matches.

import { tokenize } from "./vendor/highlight.js";

export { languageOf } from "./vendor/highlight.js";

const words = (text) => new Set(text.split(" "));

const C_LIKE =
  "if else for while do switch case default break continue return try catch finally throw goto";

// The keywords that branch, loop or jump, which take Dark+'s control color. The other keywords
// declare or import. The lists are Zed's (its highlights.scm files); Zed has none for Java,
// Ruby, PHP and Swift, so theirs are a close guess. Zed colors no Python keyword as control,
// and SQL, CSS, HTML, YAML and JSON keep one keyword color too.
const CONTROL = Object.freeze({
  js: words(`${C_LIKE} await yield`),
  rust: words("if else for while loop match in break continue return await yield"),
  go: words(
    "if else for switch select case default break continue return goto fallthrough go defer range",
  ),
  c: words(`${C_LIKE} co_await co_return co_yield`),
  java: words(`${C_LIKE} yield when`),
  ruby: words(
    `${C_LIKE} elsif unless until then when next redo retry yield begin rescue ensure raise end`,
  ),
  php: words(`${C_LIKE} foreach elseif match yield`),
  sh: words("if then else elif fi for while until do done case esac in select"),
  swift: words(`${C_LIKE} guard repeat fallthrough defer await`),
});

// Python's word operators, which Zed draws in the text color.
const PYTHON_OPERATORS = words("and or not in is");
// The languages whose other words are names: variables, fields and parameters.
const NAMED = words("js rust python go c java ruby php swift");
// The tokenizer gives these the variable class; Dark+ colors them as keywords.
const SELF = words("this self Self super cls");
// The tokenizer gives an ALL_CAPS word the boolean class; only these are booleans.
const CAPS_BOOLEANS = words("NULL TRUE FALSE");
const ALL_CAPS = /^[A-Z][A-Z0-9_]+$/;
const NAME_OR_BRACKET = /([A-Za-z_$][\w$]*)|[()[\]{}]/g;
// Each range is an element on screen, so a long line colors only its first ones.
const MAX_RANGES = 48;

/** Returns the tokens of one line on its own, so a line inside a block comment colors as code. */
export const lineTokens = (text, lang) => toRanges(tokenize(text, lang, null).spans, lang);

/** The tokens of a file's lines, read from its first line so a block comment carries over. */
export class FileTokens {
  #lines;
  #lang;
  #tokens = [];
  #state = null;

  constructor(lines, lang) {
    this.#lines = lines;
    this.#lang = lang;
  }

  /** Returns the tokens of line `i` (from 0), tokenizing the lines up to it once. */
  line(i) {
    while (this.#tokens.length <= i && this.#tokens.length < this.#lines.length) {
      const { spans, state } = tokenize(this.#lines[this.#tokens.length], this.#lang, this.#state);
      this.#tokens.push(toRanges(spans, this.#lang));
      this.#state = state;
    }

    return this.#tokens[i] ?? [];
  }
}

// A plain span holds the operators, the brackets and the names; the default text color shows
// on the operators. The tokenizer's plain tail past 600 characters gets no ranges.
const toRanges = (spans, lang) => {
  if (!lang) return [];

  const line = spans.map((span) => span.text).join("");
  let start = 0;
  const ranges = spans.flatMap((span) => {
    const at = start;
    start += span.text.length;
    if (!span.cls) return plainRanges(span.text, at, lang);

    return [{ start: at, end: start, cls: classOf(span, lang, line, at) }];
  });

  return ranges.filter((range) => range.cls).slice(0, MAX_RANGES);
};

const plainRanges = (text, at, lang) => {
  const ranges = [...text.matchAll(NAME_OR_BRACKET)].map((m) => {
    const cls = m[1] ? "variable" : "bracket";
    return { start: at + m.index, end: at + m.index + m[0].length, cls };
  });

  return NAMED.has(lang) ? ranges : ranges.filter((range) => range.cls === "bracket");
};

// A span holds one word: spaces split them. `at` is where the span starts in `line`.
const classOf = ({ text, cls }, lang, line, at) => {
  if (cls === "keyword") return keywordClass(text, lang, line, at);
  if (cls === "variable" && SELF.has(text)) return "keyword";
  if (cls === "boolean" && ALL_CAPS.test(text) && !CAPS_BOOLEANS.has(text)) return "constant";
  return cls;
};

// The tokenizer gives every keyword one class. A `default` outside a switch and Rust's `for` in
// an `impl` header declare, as in Zed.
const keywordClass = (text, lang, line, at) => {
  if (lang === "python" && PYTHON_OPERATORS.has(text)) return "";
  if (!CONTROL[lang]?.has(text)) return "keyword";

  const isDeclaring =
    (text === "default" && !/^\s*(:|->)/.test(line.slice(at + text.length))) ||
    (lang === "rust" && text === "for" && /\bimpl\b[^{]*$/.test(line.slice(0, at)));
  return isDeclaring ? "keyword" : "control";
};
