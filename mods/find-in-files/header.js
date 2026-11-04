// The top of the dialog: the query input and the option toggles, then the root and the status.

import { h_flex, Input, v_flex } from "gpui-base";
import { div, svg } from "gpui-kit";

import { SMALL_TEXT } from "./code.js";
import { keyLabel, OPTIONS } from "./options.js";

const TOGGLE = 24;
const ICON = 16;
const ON_ALPHA = "33";

/** Returns the query box and its toggles over the root and status; onToggle(option, cx) on a click. */
export const header = ({ input, options, onToggle, ...status }, t) => {
  return v_flex()
    .flex_none()
    .gap(10)
    .child(queryBox(input, { options, onToggle }, t))
    .child(statusLine(status, t));
};

const queryBox = (input, toggles, t) => {
  return h_flex()
    .h(36)
    .pl(10)
    .pr(6)
    .gap(2)
    .items_center()
    .rounded(8)
    .border_1()
    .border_color(t.accent)
    .bg(t.background)
    .child(Input.new(input).flex_1().h_full().text_size(13).text_color(t.foreground))
    .children(OPTIONS.map((option) => toggle(option, toggles, t)));
};

const toggle = (option, { options, onToggle }, t) => {
  const isOn = options[option.id];
  return div()
    .id(`fif-${option.id}`)
    .size(TOGGLE)
    .flex_none()
    .flex()
    .items_center()
    .justify_center()
    .rounded(5)
    .cursor_pointer()
    .text_color(isOn ? t.accent : t.dim)
    .when(isOn, (el) => el.bg(t.accent + ON_ALPHA))
    .hover((s) => s.text_color(t.foreground))
    .tooltip(`${option.name} (${keyLabel(option)})`)
    .on_click((_e, cx) => onToggle(option, cx))
    .child(svg(`mods/find-in-files/vendor/${option.icon}.svg`).size(ICON));
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
