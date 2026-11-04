import { describe, expect, test } from "bun:test";

import {
  isFiltersKey,
  keyLabel,
  optionFlags,
  optionOfKey,
  OPTIONS,
  readOptions,
} from "./options.js";

const CMD_ALT = { alt: true, platform: true, shift: false, control: false, function: false };
const CMD_SHIFT = { ...CMD_ALT, alt: false, shift: true };
const NOTHING = { matchCase: false, wholeWord: false, regex: false, include: "", exclude: "" };

describe("options", () => {
  describe("readOptions", () => {
    test("should turn every option off when nothing was kept", () => {
      expect(readOptions(undefined)).toEqual(NOTHING);
    });

    test("should keep only the options that were on", () => {
      const kept = { regex: true, wholeWord: "yes", other: true };

      expect(readOptions(kept)).toEqual({ ...NOTHING, regex: true });
    });

    test("should keep the path fields' text, and only text", () => {
      const kept = { include: "src, *.js", exclude: 3 };

      expect(readOptions(kept)).toEqual({ ...NOTHING, include: "src, *.js" });
    });
  });

  describe("optionFlags", () => {
    test("should give the flags of the options that are on, in order", () => {
      const options = { matchCase: true, wholeWord: false, regex: true };

      expect(optionFlags(options)).toEqual(["--case-sensitive", "--no-fixed-strings"]);
    });
  });

  describe("optionOfKey", () => {
    test.each([
      ["c", "matchCase"],
      ["b", "wholeWord"],
      ["r", "regex"],
    ])("should find the option of ⌥⌘%s", (key, id) => {
      expect(optionOfKey({ key, modifiers: CMD_ALT })?.id).toBe(id);
    });

    test.each([
      ["a letter without an option", "x", CMD_ALT],
      ["⌘ alone", "c", { ...CMD_ALT, alt: false }],
      ["⌥ alone", "c", { ...CMD_ALT, platform: false }],
      ["⇧ as well", "c", { ...CMD_ALT, shift: true }],
      ["⌃ as well", "c", { ...CMD_ALT, control: true }],
      ["fn as well", "c", { ...CMD_ALT, function: true }],
    ])("should find no option for %s", (_name, key, modifiers) => {
      expect(optionOfKey({ key, modifiers })).toBeUndefined();
    });
  });

  describe("isFiltersKey", () => {
    test.each([["j"], ["J"]])("should match ⇧⌘J when the key is %s", (key) => {
      expect(isFiltersKey({ key, modifiers: CMD_SHIFT })).toBe(true);
    });

    test.each([
      ["another letter", "k", CMD_SHIFT],
      ["⌘ alone", "j", { ...CMD_SHIFT, shift: false }],
      ["⌥ as well", "j", { ...CMD_SHIFT, alt: true }],
      ["⌃ as well", "j", { ...CMD_SHIFT, control: true }],
      ["fn as well", "j", { ...CMD_SHIFT, function: true }],
    ])("should not match %s", (_name, key, modifiers) => {
      expect(isFiltersKey({ key, modifiers })).toBe(false);
    });
  });

  describe("keyLabel", () => {
    test("should spell the key with the Mac symbols", () => {
      expect(OPTIONS.map(keyLabel)).toEqual(["⌥⌘C", "⌥⌘B", "⌥⌘R"]);
    });
  });
});
