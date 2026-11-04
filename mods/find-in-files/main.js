// Find in Files: search the focused terminal's repo, preview a hit, open it in $EDITOR.

import { InputState, v_flex, VirtualListScrollHandle } from "gpui-base";
import { View } from "gpui-kit";
import { closeOverlay, exec, props, run, setShared, shared, theme } from "herdr";

import { FileState, readFile } from "./file.js";
import { findRoot } from "./folder.js";
import { header } from "./header.js";
import { keyHints } from "./hints.js";
import { hitList } from "./hit-list.js";
import { optionFlags, optionOfKey, readOptions } from "./options.js";
import { preview } from "./preview.js";
import { displayPath, errorText, parseHits, SEARCH_SCRIPT } from "./rg.js";
import { settle } from "./settle.js";

const QUERY_KEY = "find-in-files.query";
const OPTIONS_KEY = "find-in-files.options";
const DEBOUNCE_MS = 150;
const STEPS = Object.freeze({ down: 1, up: -1 });
// Unquoted, so an $EDITOR like "code --wait" splits into words. The path keeps rg's "./", so
// a file named "-x" or "+x" is not an option.
const EDIT_SCRIPT = 'exec ${EDITOR:-nvim} "+$1" "$2"';

export default class FindInFiles extends View {
  init(_props, cx) {
    this.overlay = props()?.overlay;
    this.query = shared(QUERY_KEY) ?? "";
    this.options = readOptions(shared(OPTIONS_KEY));
    this.input = InputState.new({ placeholder: "Find in files…", value: this.query });
    this.scroll = VirtualListScrollHandle.new();

    this.root = null;
    this.machine = null;
    this.seq = 0;
    this.reset();
    // Searching until the repo root is known, too.
    this.searching = true;

    if (!this.overlay) return; // `herdr-app check` loads the mod without an overlay

    this.input.on("change", (_e, cx) => this.changed(cx));
    this.input.on("submit", () => this.open(this.hits[this.selected]));

    // The last query is selected, so typing replaces it.
    this.input.focus();
    this.input.set_selected_range({ start: 0, end: this.query.length });

    cx.spawn(async (cx) => this.start(await findRoot(), cx));
  }

  // No hits, and no files read for the preview.
  reset() {
    this.hits = [];
    this.hasMore = false;
    this.selected = 0;
    this.error = null;
    this.searching = false;
    this.files = new Map();
  }

  start({ root, machine }, cx) {
    this.root = root;
    this.machine = machine;
    this.search(this.seq, cx);
  }

  close() {
    closeOverlay(this.overlay);
  }

  changed(cx) {
    this.query = this.input.value();
    const seq = ++this.seq;
    cx.timer.after(DEBOUNCE_MS, (cx) => {
      if (seq === this.seq) this.search(seq, cx);
    });
  }

  // A toggle searches at once: there is no typing to wait for.
  toggle(option, cx) {
    this.options = { ...this.options, [option.id]: !this.options[option.id] };
    setShared(OPTIONS_KEY, this.options);
    // A click on a toggle must not take the keyboard from the query.
    this.input.focus();
    this.search(++this.seq, cx);
  }

  // exec cannot be cancelled, so a newer query (a higher seq) drops the result of an older one.
  search(seq, cx) {
    // Before the root is known, the root lookup searches for the latest query.
    if (this.root === null) return;

    setShared(QUERY_KEY, this.query);

    if (!this.query) {
      this.reset();
      cx.notify();
      return;
    }

    this.searching = true;
    cx.notify();
    cx.spawn(async (cx) => this.showHits(seq, await this.runSearch(), cx));
  }

  runSearch() {
    // The script's --smart-case comes first, so --case-sensitive overrides it.
    const flags = optionFlags(this.options);
    const args = ["-c", SEARCH_SCRIPT, "sh", ...flags, "--", this.query, "."];
    return settle(exec("sh", args, { cwd: this.root, on: this.machine }));
  }

  showHits(seq, result, cx) {
    if (seq !== this.seq) return;

    this.reset();

    if (result instanceof Error) {
      this.error = result.message;
      cx.notify();
      return;
    }

    // rg reports an unreadable file on stderr and still lists the hits in the rest.
    this.error = errorText(result.stderr);
    ({ hits: this.hits, hasMore: this.hasMore } = parseHits(result.stdout));
    this.select(0, cx);
  }

  // A click selects without a scroll, so the row stays under the pointer.
  select(i, cx, { scroll = true } = {}) {
    this.selected = Math.max(0, Math.min(i, this.hits.length - 1));
    if (scroll && this.hits.length) this.scroll.scroll_to_item(this.selected, "center");
    this.read(this.hits[this.selected], cx);
    cx.notify();
  }

  // Reads the selected hit's file for the preview, once per search.
  read(hit, cx) {
    if (!hit || this.files.has(hit.path)) return;

    const files = this.files;
    const path = `${this.root}/${displayPath(hit.path)}`;
    files.set(hit.path, { state: FileState.Reading });

    cx.spawn(async (cx) => {
      files.set(hit.path, await readFile(path, this.machine));
      cx.notify();
    });
  }

  open(hit) {
    if (!hit) return;

    this.close();
    const argv = ["sh", "-c", EDIT_SCRIPT, "sh", String(hit.line), hit.path];
    run("terminal.open", { argv, folder: this.root, place: "right" });
  }

  key(e, cx) {
    if (e.key === "escape") return this.close();

    const option = optionOfKey(e);
    const step = STEPS[e.key];
    if (!option && !step) return;

    if (option) this.toggle(option, cx);
    if (step) this.select(this.selected + step, cx);
    cx.stop_propagation();
  }

  status() {
    if (this.searching) return "Searching…";
    if (!this.query) return "";

    const n = this.hits.length;
    const count = `${n}${this.hasMore ? "+" : ""} ${n === 1 ? "hit" : "hits"}`;
    return [this.error, count].filter(Boolean).join(" · ");
  }

  emptyText() {
    if (this.searching) return "";
    return this.query ? "No hits" : `Type to search ${this.root}`;
  }

  render() {
    const t = theme();
    const hit = this.hits[this.selected];
    const top = {
      input: this.input,
      options: this.options,
      onToggle: (option, cx) => this.toggle(option, cx),
      root: this.root,
      status: this.status(),
      isError: Boolean(this.error),
    };
    const list = {
      hits: this.hits,
      selected: this.selected,
      scroll: this.scroll,
      onClick: (i, cx) => this.select(i, cx, { scroll: false }),
      emptyText: this.emptyText(),
    };

    return v_flex()
      .id("find-in-files")
      .size_full()
      .min_h(0)
      .p(14)
      .gap(10)
      .bg(t.surface)
      .text_size(13)
      .text_color(t.foreground)
      .on_key_down((e, cx) => this.key(e, cx))
      .child(header(top, t))
      .child(hitList(list, t))
      .child(preview(hit, hit && this.files.get(hit.path), t))
      .child(keyHints(t));
  }
}
