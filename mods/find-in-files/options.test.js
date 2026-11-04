import { describe, expect, test } from "bun:test";

import { keyLabel, optionFlags, optionOfKey, OPTIONS, readOptions } from "./options.js";

const CMD_ALT = { alt: true, platform: true, shift: false, control: false, function: false };

describe("options", () => {
  describe("readOptions", () => {
    test("should turn every option off when nothing was kept", () => {
      expect(readOptions(undefined)).toEqual({ matchCase: false, wholeWord: false, regex: false });
    });

    test("should keep only the options that were on", () => {
      const kept = { regex: true, wholeWord: "yes", other: true };

      expect(readOptions(kept)).toEqual({ matchCase: false, wholeWord: false, regex: true });
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

  describe("keyLabel", () => {
    test("should spell the key with the Mac symbols", () => {
      expect(OPTIONS.map(keyLabel)).toEqual(["⌥⌘C", "⌥⌘B", "⌥⌘R"]);
    });
  });
});
