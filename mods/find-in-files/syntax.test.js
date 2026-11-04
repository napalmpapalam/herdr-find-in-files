import { describe, expect, test } from "bun:test";

import { FileTokens, languageOf, lineTokens } from "./syntax.js";

describe("syntax", () => {
  describe("lineTokens", () => {
    test("should give the colored words of a line as ranges", () => {
      const tokens = lineTokens("const x = 1;", "js");

      expect(tokens).toEqual([
        { start: 0, end: 5, cls: "keyword" },
        { start: 6, end: 7, cls: "variable" },
        { start: 10, end: 11, cls: "number" },
      ]);
    });

    test("should color the names, brackets, constants and `this` of a line", () => {
      const text = "f(this.a[i], MAX_N, NULL)";

      const tokens = lineTokens(text, "js");

      expect(tokens.map((t) => [text.slice(t.start, t.end), t.cls])).toEqual([
        ["f", "function"],
        ["(", "bracket"],
        ["this", "keyword"],
        ["a", "variable"],
        ["[", "bracket"],
        ["i", "variable"],
        ["]", "bracket"],
        ["MAX_N", "constant"],
        ["NULL", "boolean"],
        [")", "bracket"],
      ]);
    });

    test("should color no names in shell, where a plain word is an argument", () => {
      const text = '[ -n "$X" ] && echo hi';

      const tokens = lineTokens(text, "sh");

      expect(tokens.map((t) => t.cls)).toEqual(["bracket", "string", "bracket"]);
    });

    test("should color at most 48 parts of a line", () => {
      expect(lineTokens("a ".repeat(60), "js")).toHaveLength(48);
    });

    test.each([
      [
        "js",
        "export const f = () => { return 1; };",
        [
          ["export", "keyword"],
          ["const", "keyword"],
          ["return", "control"],
        ],
      ],
      [
        "js",
        "export default x; switch (y) { default: break; }",
        [
          ["export", "keyword"],
          ["default", "keyword"],
          ["switch", "control"],
          ["default", "control"],
          ["break", "control"],
        ],
      ],
      [
        "rust",
        "impl X for Y { fn f() { for i in v {} } }",
        [
          ["impl", "keyword"],
          ["for", "keyword"],
          ["fn", "keyword"],
          ["for", "control"],
          ["in", "control"],
        ],
      ],
      [
        "python",
        "if x and y: import os",
        [
          ["if", "keyword"],
          ["import", "keyword"],
        ],
      ],
      [
        "sh",
        "export X; if true; then exit 0; fi",
        [
          ["export", "keyword"],
          ["if", "control"],
          ["then", "control"],
          ["exit", "keyword"],
          ["fi", "control"],
        ],
      ],
    ])("should tell the %s keywords that branch from the ones that declare", (lang, text, want) => {
      const tokens = lineTokens(text, lang).filter(
        (t) => t.cls === "keyword" || t.cls === "control",
      );

      expect(tokens.map((t) => [text.slice(t.start, t.end), t.cls])).toEqual(want);
    });

    test("should keep one keyword class in SQL", () => {
      const tokens = lineTokens("select x from t where y", "sql");

      expect(tokens.map((t) => t.cls)).toEqual(["keyword", "keyword", "keyword"]);
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
