import { describe, expect, test } from "bun:test";

import { displayPath, parseHits } from "./rg.js";

const X = [{ start: 0, end: 1 }];

const match = (path, line, text, submatches = X) => {
  const data = { path: { text: path }, lines: { text }, line_number: line, submatches };
  return JSON.stringify({ type: "match", data });
};

describe("rg", () => {
  describe("parseHits", () => {
    test("should read one hit per matching line and skip the other rows", () => {
      const ranges = [
        { start: 4, end: 7 },
        { start: 10, end: 13 },
      ];
      const out = [
        JSON.stringify({ type: "begin", data: { path: { text: "./a.js" } } }),
        match("./a.js", 3, "let foo = foo;\n", ranges),
        JSON.stringify({ type: "end", data: {} }),
        "",
      ].join("\n");

      const { hits, hasMore } = parseHits(out);

      expect(hits).toEqual([{ path: "./a.js", line: 3, text: "let foo = foo;", ranges }]);
      expect(hasMore).toBe(false);
    });

    test("should turn UTF-8 byte offsets into string indexes", () => {
      // "é" is 2 bytes, "😀" is 4 bytes and 2 UTF-16 units.
      const out = match("b.md", 1, "é😀 foo é foo\r\n", [
        { start: 7, end: 10 },
        { start: 14, end: 17 },
      ]);

      const [hit] = parseHits(out).hits;

      expect(hit.text).toBe("é😀 foo é foo");
      expect(hit.ranges).toEqual([
        { start: 4, end: 7 },
        { start: 10, end: 13 },
      ]);
    });

    test("should skip a file whose name is not UTF-8", () => {
      const data = { path: { bytes: "/w==" }, lines: { text: "x" }, line_number: 1, submatches: X };
      const out = JSON.stringify({ type: "match", data });

      expect(parseHits(out).hits).toEqual([]);
    });

    test("should skip a row cut off at the end of the output", () => {
      const out = `${match("c.js", 1, "x\n")}\n${match("c.js", 2, "x\n").slice(0, 40)}`;

      const { hits } = parseHits(out);

      expect(hits.map((hit) => hit.line)).toEqual([1]);
    });

    test("should stop at the cap and say there are more", () => {
      const out = [1, 2, 3].map((n) => match("c.js", n, "x\n")).join("\n");

      const { hits, hasMore } = parseHits(out, 2);

      expect(hits.map((hit) => hit.line)).toEqual([1, 2]);
      expect(hasMore).toBe(true);
    });

    test("should sort the hits by path, then line", () => {
      const rows = [
        ["./b.js", 1],
        ["./a.js", 7],
        ["./a.js", 2],
      ];
      const out = rows.map(([path, line]) => match(path, line, "x\n")).join("\n");

      const { hits } = parseHits(out);

      expect(hits.map((hit) => `${hit.path}:${hit.line}`)).toEqual([
        "./a.js:2",
        "./a.js:7",
        "./b.js:1",
      ]);
    });
  });

  describe("displayPath", () => {
    test.each([
      ["./src/a.js", "src/a.js"],
      ["src/a.js", "src/a.js"],
    ])("should show %s as %s", (path, shown) => {
      expect(displayPath(path)).toBe(shown);
    });
  });
});
