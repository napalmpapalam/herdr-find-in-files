// The preview of the selected hit: its line and the lines around it.

import { h_flex, v_flex } from "gpui-base";
import { div } from "gpui-kit";

import { codeFont, codeLine, codeSize, SMALL_TEXT } from "./code.js";
import { FileState } from "./file.js";
import { clip, spans, startColumn } from "./lines.js";
import { displayPath } from "./rg.js";

// Lines the preview shows above and below the hit line.
const CONTEXT = 5;
const HEAD = 30;
const LINE_HEIGHT = 1.6;
// Of the font size: a code font's digit, for the width of the line numbers.
const CHAR_WIDTH = 0.62;

/** Returns the preview of `hit`, whose file is `file` ({ state, lines, tokens }) once asked for. */
export const preview = (hit, file, t) => {
  const size = codeSize();
  const lineHeight = Math.round(size * LINE_HEIGHT);
  // The head, its bottom border, the body's top and bottom padding, the box's two borders.
  const height = HEAD + 1 + 4 + (2 * CONTEXT + 1) * lineHeight + 2;
  const box = v_flex()
    .flex_none()
    .h(height)
    .rounded(7)
    .border_1()
    .border_color(t.border)
    .bg(t.background)
    .overflow_hidden();

  if (!hit) return box;

  return box.child(head(hit, t)).child(body(hit, file, { size, lineHeight }, t));
};

const head = (hit, t) => {
  const where = div()
    .truncate()
    .child(`${displayPath(hit.path)}:${hit.line}`);

  return h_flex()
    .h(HEAD)
    .flex_none()
    .px(10)
    .items_center()
    .border_b(1)
    .border_color(t.border)
    .text_size(SMALL_TEXT)
    .text_color(t.dim)
    .child(where);
};

const body = (hit, file, { size, lineHeight }, t) => {
  if (!file || file.state === FileState.Reading) return div();
  if (file.state === FileState.Unreadable) return note("Cannot read this file", t);
  // The file changed since the search, or is longer than readTextFile reads.
  if (hit.line > file.lines.length) return note(`Line ${hit.line} is not in the file now`, t);

  const from = Math.max(0, hit.line - 1 - CONTEXT);
  const to = Math.min(file.lines.length, hit.line + CONTEXT);
  const look = {
    hit,
    lineHeight,
    gutter: Math.ceil(String(to).length * size * CHAR_WIDTH) + 16,
    // Every line starts at one column: the one that brings the first match into view.
    start: startColumn(hit.text, hit.ranges),
  };

  const lines = file.lines.slice(from, to).map((text, k) => {
    const i = from + k;
    return line({ text, tokens: file.tokens.line(i) }, i + 1, look, t);
  });

  return v_flex().py(2).font_family(codeFont()).text_size(size).children(lines);
};

const line = ({ text, tokens }, n, { hit, lineHeight, gutter, start }, t) => {
  const isHit = n === hit.line;
  const part = clip({ text, ranges: isHit ? hit.ranges : [], tokens }, start);
  const number = h_flex()
    .w(gutter)
    .flex_none()
    .justify_end()
    .pr(12)
    .text_color(isHit ? t.foreground : t.dim)
    .child(String(n));

  return h_flex()
    .h(lineHeight)
    .flex_none()
    .when(isHit, (el) => el.bg(t.selected))
    .child(number)
    .child(codeLine(spans(part), t));
};

const note = (text, t) => div().p(10).text_color(t.dim).child(text);
