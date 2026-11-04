// A line of code, syntax colored with its matches marked, for the hit rows and the preview.

import { h_flex } from "gpui-base";
import { div } from "gpui-kit";
import { settings } from "herdr";

import { expandTabs } from "./lines.js";

export const SMALL_TEXT = 11.5;

const MARK_ALPHA = "55";

// VS Code's Dark+ and Light+ token colors. A declaring keyword and a control keyword differ.
// `text` is the editor's own color, which operators keep.
const DARK_SYNTAX = Object.freeze({
  text: "#d4d4d4",
  keyword: "#569cd6",
  control: "#c586c0",
  string: "#ce9178",
  comment: "#6a9955",
  number: "#b5cea8",
  function: "#dcdcaa",
  type: "#4ec9b0",
  boolean: "#569cd6",
  variable: "#9cdcfe",
  constant: "#4fc1ff",
  bracket: "#ffd700",
});

const LIGHT_SYNTAX = Object.freeze({
  text: "#000000",
  keyword: "#0000ff",
  control: "#af00db",
  string: "#a31515",
  comment: "#008000",
  number: "#098658",
  function: "#795e26",
  type: "#267f99",
  boolean: "#0000ff",
  variable: "#001080",
  constant: "#0070c1",
  bracket: "#0431fa",
});

/** Returns `parts` ({ text, mark, cls? }) on one line that clips at the right edge. */
export const codeLine = (parts, t) => {
  const syntax = settings().dark ? DARK_SYNTAX : LIGHT_SYNTAX;

  return h_flex()
    .flex_1()
    .min_w(0)
    .overflow_hidden()
    .whitespace_nowrap()
    .text_color(syntax.text)
    .children(parts.map((part) => codePart(part, syntax, t)));
};

export const codeFont = () => {
  return (typeof settings().font === "string" && settings().font) || "JetBrains Mono";
};

export const codeSize = () => Math.max(9, (Number(settings().font_size) || 14) - 1);

const codePart = (part, syntax, t) => {
  const el = div()
    .text_color(syntax[part.cls] ?? syntax.text)
    .child(expandTabs(part.text));

  return part.mark ? el.bg(t.accent + MARK_ALPHA).rounded(2) : el;
};
