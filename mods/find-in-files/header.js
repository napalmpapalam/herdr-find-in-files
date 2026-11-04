// The top of the dialog: the query input and its toggles, the path fields, the root and the status.

import { h_flex, Input, v_flex } from "gpui-base";
import { div, svg } from "gpui-kit";

import { SMALL_TEXT } from "./code.js";
import { FILTERS_KEY, keyLabel, OPTIONS } from "./options.js";

const TOGGLE = 24;
const ICON = 16;
const ON_ALPHA = "33";
const QUERY = 36;
const FIELD = 30;

/** Returns the query box and its toggles, the path fields when shown, the root and the status. */
export const header = ({ input, options, onToggle, paths, onFilters, ...status }, t) => {
  const toggles = OPTIONS.map((option) => ({
    id: option.id,
    icon: option.icon,
    tip: `${option.name} (${keyLabel(option)})`,
    isOn: options[option.id],
    onClick: (cx) => onToggle(option, cx),
  }));

  return v_flex()
    .flex_none()
    .gap(10)
    .child(queryBox(input, [...toggles, filterToggle(paths, onFilters)], t))
    .when(Boolean(paths), (el) => el.child(pathFields(paths, t)))
    .child(statusLine(status, t));
};

// On while the path fields show.
const filterToggle = (paths, onFilters) => {
  return {
    id: "filters",
    icon: "filter",
    tip: `Files to include and exclude (${FILTERS_KEY.label})`,
    isOn: Boolean(paths),
    onClick: onFilters,
  };
};

const queryBox = (input, toggles, t) => {
  return h_flex()
    .h(QUERY)
    .pl(10)
    .pr(6)
    .gap(2)
    .items_center()
    .rounded(8)
    .border_1()
    .border_color(t.accent)
    .bg(t.background)
    .child(textInput(input, t))
    .children(toggles.map((it) => toggle(it, t)));
};

const toggle = ({ id, icon, tip, isOn, onClick }, t) => {
  return div()
    .id(`fif-${id}`)
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
    .tooltip(tip)
    .on_click((_e, cx) => onClick(cx))
    .child(svg(`mods/find-in-files/vendor/${icon}.svg`).size(ICON));
};

const pathFields = (inputs, t) => {
  return h_flex()
    .gap(10)
    .children(inputs.map((input) => pathField(input, t)));
};

const pathField = (input, t) => {
  return h_flex()
    .flex_1()
    .min_w(0)
    .h(FIELD)
    .px(10)
    .items_center()
    .rounded(7)
    .border_1()
    .border_color(t.border)
    .bg(t.background)
    .child(textInput(input, t));
};

const textInput = (input, t) => {
  return Input.new(input).flex_1().h_full().text_size(13).text_color(t.foreground);
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
