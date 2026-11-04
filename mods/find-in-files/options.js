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

/** The key that shows and hides the path fields. */
export const FILTERS_KEY = Object.freeze({ key: "j", label: "⇧⌘J" });

/** Returns the toggles and path fields that `shared` kept: off and empty when it kept none. */
export const readOptions = (kept) => {
  const toggles = Object.fromEntries(OPTIONS.map(({ id }) => [id, kept?.[id] === true]));
  return { ...toggles, include: keptText(kept?.include), exclude: keptText(kept?.exclude) };
};

const keptText = (value) => (typeof value === "string" ? value : "");

/** Returns the rg flags of the options that are on. */
export const optionFlags = (options) => {
  return OPTIONS.filter(({ id }) => options[id]).map(({ flag }) => flag);
};

/** Returns the option whose key `e` is (⌥⌘ and the letter), else undefined. */
export const optionOfKey = ({ key, modifiers: m }) => {
  if (!m.alt || !m.platform || m.shift || m.control || m.function) return undefined;
  return OPTIONS.find((option) => option.key === key);
};

/** Returns whether `e` is ⇧⌘J, the key of the path fields. */
export const isFiltersKey = ({ key, modifiers: m }) => {
  return (
    key.toLowerCase() === FILTERS_KEY.key &&
    m.shift &&
    m.platform &&
    !m.alt &&
    !m.control &&
    !m.function
  );
};

/** Returns an option's key as the Mac spells it, e.g. "⌥⌘C". */
export const keyLabel = (option) => `⌥⌘${option.key.toUpperCase()}`;
