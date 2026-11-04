// The list of hits: a row per matching line, the selected one tinted.

import { h_flex, Scrollbar, v_flex, v_virtual_list } from "gpui-base";
import { div } from "gpui-kit";

import { codeFont, codeLine, SMALL_TEXT } from "./code.js";
import { excerpt, spans } from "./lines.js";
import { displayPath } from "./rg.js";
import { languageOf, lineTokens } from "./syntax.js";

const ID = "fif-hits";
const ROW = 26;
const PATH_WIDTH = 360;

/** Returns the hit list, or `emptyText` without hits; `onClick(index, cx)` gets a clicked hit. */
export const hitList = (list, t) => {
  const box = v_flex()
    .flex_1()
    .min_h(0)
    .rounded(7)
    .border_1()
    .border_color(t.border)
    .overflow_hidden();
  if (!list.hits.length) return box.child(div().p(12).text_color(t.dim).child(list.emptyText));

  return box.child(rows(list, t));
};

const rows = ({ hits, selected, scroll, onClick }, t) => {
  const render = (range) => {
    return hits
      .slice(range.start, range.end)
      .map((hit, k) => hitRow(hit, range.start + k === selected, t));
  };
  const click = (key, cx) => {
    const i = hits.findIndex((hit) => hitKey(hit) === key);
    onClick(i, cx);
  };
  const list = v_virtual_list(ID, hits.length, ROW, (i) => hitKey(hits[i]), render)
    .size_full()
    .track_scroll(scroll)
    .on_item_click(click);

  return div()
    .relative()
    .flex_1()
    .min_h(0)
    .child(list)
    .child(Scrollbar.vertical(ID).absolute().inset_0());
};

// One hit per line, so path:line is unique.
const hitKey = (hit) => `${hit.path}:${hit.line}`;

const hitRow = (hit, isSelected, t) => {
  // Only the part in view: the tokenizer colors at most 24 spans of a line.
  const part = excerpt(hit);
  const tokens = lineTokens(part.text, languageOf(hit.path));

  return h_flex()
    .h(ROW)
    .px(10)
    .gap(16)
    .items_center()
    .cursor_pointer()
    .bg(isSelected ? t.selected : t.surface)
    .hover((s) => s.bg(isSelected ? t.selected : t.hover))
    .child(codeLine(spans({ ...part, tokens }), t).font_family(codeFont()))
    .child(location(displayPath(hit.path), hit.line, t));
};

// The file name and line, then the folder, cut on the right when long.
const location = (path, line, t) => {
  const slash = path.lastIndexOf("/");
  const name = div()
    .flex_none()
    .text_color(t.foreground)
    .child(`${path.slice(slash + 1)}:${line}`);
  const folder = div().min_w(0).truncate().text_color(t.dim).child(path.slice(0, slash));

  return h_flex()
    .flex_none()
    .max_w(PATH_WIDTH)
    .gap(6)
    .text_size(SMALL_TEXT)
    .child(name)
    .when(slash > 0, (el) => el.child(folder));
};
