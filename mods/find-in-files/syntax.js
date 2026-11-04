// Syntax tokens of a line, as ranges ({ start, end, cls }) that lines.js cuts like the matches.

import { tokenize } from "./vendor/highlight.js";

export { languageOf } from "./vendor/highlight.js";

/** Returns the tokens of one line on its own, so a line inside a block comment colors as code. */
export const lineTokens = (text, lang) => toRanges(tokenize(text, lang, null).spans);

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
      this.#tokens.push(toRanges(spans));
      this.#state = state;
    }

    return this.#tokens[i] ?? [];
  }
}

// Plain spans get no range: the default text color shows there, and the tokenizer's plain
// tail past 600 characters drops out.
const toRanges = (spans) => {
  const ranges = spans.reduce((acc, span) => {
    const start = acc.at(-1)?.end ?? 0;
    acc.push({ start, end: start + span.text.length, cls: span.cls });
    return acc;
  }, []);

  return ranges.filter((range) => range.cls);
};
