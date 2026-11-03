// A line of code with its matches marked, for the hit rows and the preview.

import { h_flex } from "gpui-base";
import { div } from "gpui-kit";
import { settings } from "herdr";

import { expandTabs } from "./lines.js";

export const SMALL_TEXT = 11.5;

const MARK_ALPHA = "55";

/** Returns `parts` ({ text, mark }) on one line that clips at the right edge. */
export const codeLine = (parts, t) => {
  return h_flex()
    .flex_1()
    .min_w(0)
    .overflow_hidden()
    .whitespace_nowrap()
    .text_color(t.foreground)
    .children(parts.map((part) => codePart(part, t)));
};

export const codeFont = () => {
  return (typeof settings().font === "string" && settings().font) || "JetBrains Mono";
};

export const codeSize = () => Math.max(9, (Number(settings().font_size) || 14) - 1);

const codePart = (part, t) => {
  const el = div().child(expandTabs(part.text));
  return part.mark ? el.bg(t.accent + MARK_ALPHA).rounded(2) : el;
};
