import { describe, expect, test } from "bun:test";

import { FileTokens, languageOf, lineTokens } from "./syntax.js";

describe("syntax", () => {
  describe("lineTokens", () => {
    test("should give the colored words of a line as ranges", () => {
      const tokens = lineTokens("const x = 1;", "js");

      expect(tokens).toEqual([
        { start: 0, end: 5, cls: "keyword" },
        { start: 10, end: 11, cls: "number" },
      ]);
    });

    test("should give no tokens to a file without a language", () => {
      expect(lineTokens("const x = 1;", languageOf("notes.txt"))).toEqual([]);
    });
  });

  describe("FileTokens", () => {
    test.each([
      ["a block comment", "a.ts", ["/* start", "const x", "end */"], "comment"],
      ["a block comment never closed", "a.ts", ["x /*", "const x"], "comment"],
      ["a triple-quoted string", "a.py", ['x = """', "def f", '"""'], "string"],
    ])("should carry %s from the line above", (_name, path, lines, cls) => {
      const tokens = new FileTokens(lines, languageOf(path));

      expect(tokens.line(1)).toEqual([{ start: 0, end: lines[1].length, cls }]);
    });

    test("should give no tokens past the last line", () => {
      expect(new FileTokens(["x"], languageOf("a.js")).line(5)).toEqual([]);
    });
  });
});
