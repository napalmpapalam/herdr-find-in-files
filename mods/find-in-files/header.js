// The top of the dialog: the query input, then the root and the status.

import { h_flex, Input, v_flex } from "gpui-base";
import { div } from "gpui-kit";

import { SMALL_TEXT } from "./code.js";

/** Returns the query input over a line with the searched root and the status. */
export const header = ({ input, ...status }, t) => {
  return v_flex().flex_none().gap(10).child(queryBox(input, t)).child(statusLine(status, t));
};

const queryBox = (input, t) => {
  return h_flex()
    .h(36)
    .px(10)
    .items_center()
    .rounded(8)
    .border_1()
    .border_color(t.accent)
    .bg(t.background)
    .child(Input.new(input).flex_1().h_full().text_size(13).text_color(t.foreground));
};

const statusLine = ({ root, status, isError }, t) => {
  const where = div()
    .flex_1()
    .min_w(0)
    .truncate()
    .text_color(t.dim)
    .child(root ?? "");
  const what = div()
    .flex_none()
    .text_color(isError ? t.blocked : t.dim)
    .child(status);

  return h_flex().gap(12).px(2).text_size(SMALL_TEXT).child(where).child(what);
};
