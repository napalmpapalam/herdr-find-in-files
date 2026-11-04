// The search options: each one is a toggle in the query box, a key, and an rg flag.

/** The options in the order the query box shows them. `key` takes ⌥⌘; `icon` is in vendor/. */
export const OPTIONS = Object.freeze([
  Object.freeze({
    id: "matchCase",
    name: "Match case",
    key: "c",
    flag: "--case-sensitive",
    icon: "case-sensitive",
  }),
  Object.freeze({
    id: "wholeWord",
    name: "Whole word",
    key: "b",
    flag: "--word-regexp",
    icon: "whole-word",
  }),
  // rg's script searches with --fixed-strings, and this flag turns it off.
  Object.freeze({
    id: "regex",
    name: "Regex",
    key: "r",
    flag: "--no-fixed-strings",
    icon: "regex",
  }),
]);

/** Returns the options from what `shared` kept, every option off when it kept nothing. */
export const readOptions = (kept) => {
  return Object.fromEntries(OPTIONS.map(({ id }) => [id, kept?.[id] === true]));
};

/** Returns the rg flags of the options that are on. */
export const optionFlags = (options) => {
  return OPTIONS.filter(({ id }) => options[id]).map(({ flag }) => flag);
};

/** Returns the option whose key `e` is (⌥⌘ and the letter), else undefined. */
export const optionOfKey = ({ key, modifiers: m }) => {
  if (!m.alt || !m.platform || m.shift || m.control || m.function) return undefined;
  return OPTIONS.find((option) => option.key === key);
};

/** Returns an option's key as the Mac spells it, e.g. "⌥⌘C". */
export const keyLabel = (option) => `⌥⌘${option.key.toUpperCase()}`;
