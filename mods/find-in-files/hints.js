// The line of keys at the bottom of the dialog.

import { h_flex } from "gpui-base";
import { div } from "gpui-kit";

import { SMALL_TEXT } from "./code.js";
import { keyLabel, OPTIONS } from "./options.js";

const HINTS = Object.freeze([
  ["↑↓", "select"],
  ["↵", "open"],
  ["esc", "close"],
  ...OPTIONS.map((option) => [keyLabel(option), option.name.toLowerCase()]),
]);

/** Returns the dialog's keys, each one with what it does. */
export const keyHints = (t) => {
  // The dialog's 10px gap plus 4 matches its 14px padding below, so the line sits in the middle.
  return h_flex()
    .flex_none()
    .gap(14)
    .px(2)
    .pt(4)
    .text_size(SMALL_TEXT)
    .text_color(t.dim)
    .children(HINTS.map(([key, what]) => hint(key, what, t)));
};

const hint = (key, what, t) => {
  return h_flex().gap(5).child(div().text_color(t.foreground).child(key)).child(what);
};
