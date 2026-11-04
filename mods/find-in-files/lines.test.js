import { describe, expect, test } from "bun:test";

import { clip, excerpt, fileLines, spans, startColumn } from "./lines.js";

const FOO_AT_100 = { text: "x".repeat(100) + "foo", ranges: [{ start: 100, end: 103 }] };

describe("lines", () => {
  describe("fileLines", () => {
    test.each([
      ["a\r\nb\n", ["a", "b"]],
      ["a\n\nb", ["a", "", "b"]],
    ])("should split %j into its lines", (text, lines) => {
      expect(fileLines(text)).toEqual(lines);
    });
  });

  describe("startColumn", () => {
    test("should start a line a little before a match far in", () => {
      expect(startColumn(FOO_AT_100.text, FOO_AT_100.ranges)).toBe(80);
    });

    test("should start a line at `from` when its match is near", () => {
      expect(startColumn("  foo", [{ start: 2, end: 5 }], 2)).toBe(2);
    });

    test("should not start between the halves of a surrogate pair", () => {
      const text = "x".repeat(79) + "😀" + "x".repeat(19) + "foo";

      expect(startColumn(text, [{ start: 100, end: 103 }])).toBe(79);
    });
  });

  describe("clip", () => {
    test("should keep the ranges inside the window, moved to it", () => {
      const ranges = [
        { start: 1, end: 3 },
        { start: 4, end: 6 },
        { start: 8, end: 9 },
      ];

      const part = clip({ text: "0123456789", ranges }, 3, 4);

      expect(part).toEqual({ text: "3456", ranges: [{ start: 1, end: 3 }], tokens: [] });
    });

    test("should cut a token at the window's edge and keep its class", () => {
      const tokens = [{ start: 0, end: 5, cls: "keyword" }];

      const part = clip({ text: "0123456789", ranges: [], tokens }, 3, 4);

      expect(part.tokens).toEqual([{ start: 0, end: 2, cls: "keyword" }]);
    });
  });

  describe("excerpt", () => {
    test("should drop the indent", () => {
      const part = excerpt({ text: "    foo", ranges: [{ start: 4, end: 7 }] });

      expect(part).toEqual({ text: "foo", ranges: [{ start: 0, end: 3 }] });
    });

    test("should cut the line of a far match with an ellipsis", () => {
      const part = excerpt(FOO_AT_100);

      expect(part).toEqual({
        text: "…" + "x".repeat(20) + "foo",
        ranges: [{ start: 21, end: 24 }],
      });
    });
  });

  describe("spans", () => {
    test("should cut a line into plain and marked parts", () => {
      const ranges = [
        { start: 4, end: 7 },
        { start: 10, end: 13 },
      ];

      const parts = spans({ text: "let foo = foo;", ranges });

      expect(parts.map((part) => [part.text, part.mark])).toEqual([
        ["let ", false],
        ["foo", true],
        [" = ", false],
        ["foo", true],
        [";", false],
      ]);
    });

    test("should mark nothing for an empty range", () => {
      const parts = spans({ text: "abc", ranges: [{ start: 1, end: 1 }] });

      expect(parts.map((part) => [part.text, part.mark])).toEqual([
        ["a", false],
        ["bc", false],
      ]);
    });

    test("should give a line without ranges as one plain part", () => {
      expect(spans({ text: "abc", ranges: [] })).toEqual([{ text: "abc", mark: false }]);
    });

    test("should cut a token where a match starts and ends", () => {
      const line = {
        text: "let foo;",
        ranges: [{ start: 5, end: 6 }],
        tokens: [
          { start: 0, end: 3, cls: "keyword" },
          { start: 4, end: 7, cls: "variable" },
        ],
      };

      const parts = spans(line);

      expect(parts.map((part) => [part.text, part.mark, part.cls])).toEqual([
        ["let", false, "keyword"],
        [" ", false, undefined],
        ["f", false, "variable"],
        ["o", true, "variable"],
        ["o", false, "variable"],
        [";", false, undefined],
      ]);
    });

    test("should cut a match where a token starts and ends", () => {
      const line = {
        text: "foo.bar",
        ranges: [{ start: 2, end: 5 }],
        tokens: [
          { start: 0, end: 3, cls: "variable" },
          { start: 4, end: 7, cls: "function" },
        ],
      };

      const parts = spans(line);

      expect(parts.map((part) => [part.text, part.mark, part.cls])).toEqual([
        ["fo", false, "variable"],
        ["o", true, "variable"],
        [".", true, undefined],
        ["b", true, "function"],
        ["ar", false, "function"],
      ]);
    });
  });
});
